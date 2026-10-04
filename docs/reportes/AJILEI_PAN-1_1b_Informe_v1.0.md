# AJILEI · PAN-1 · 1b · Piso táctil (camino Z) y sus vigilantes · Informe v1.0

**Fecha:** 2026-10-04. Primera vuelta de 12:20 a 13:25; segunda vuelta (respuestas del rector a §6) desde las 14:02 (§11).
**Ficha:** `AJILEI_PAN-1_1b_PisoTactil_v1.0.md`. Base `3d1b19e`.
**Estado:** parada en el STOP del Paso 6, **con el mapa actualizado** (§11.5) y a la espera del «OK mapa». Sin commits. Las cuatro preguntas de §6 están contestadas: §§1–10 cuentan la primera vuelta tal como fue, y §11 cuenta la segunda, que es la que manda.

## §0 · Resumen

> **Segunda vuelta (§11):** con las respuestas del rector, la hoja deja de ser Z literal en tres sitios (la tarjeta, la ✕ de mesa 3 y la ✕ de mesa 4 en apaisado), y `tactil` deja de medir en el pago el nombre del panel revelado. **La puerta del commit 1 se cumple:** `apu 360x640` verde y `tactil` completo **36/36**. Sin la hoja, los dos siguen rojos. Lo de abajo es la primera vuelta.

- **La hoja está puesta tal cual:** `src/styles/tactil.css` es el «CSS final» de Z del anexo de la Fase 0, **literal** (diff vacío contra el informe), con una cabecera que cita PAN-1, INV-07 y la regla de especificidad. Se importa en `GameTable.jsx` en la línea siguiente a `rec.css`. Ningún protegido se ha abierto para escribir.
- **Los vigilantes saben fallar.** Sin la hoja, `tactil 360x640` sale rojo en las cuatro mesas y `apu 360x640` sale rojo en `apu.6` (multiplicadores), `tel.blanda` (36) y `tel.forzosa` («Ver la mesa», 36).
- **Pero Z literal no deja verde todo lo que la ficha pide.** Cuatro huecos, todos fuera de lo que midió la lámina:
  1. **La tarjeta automática a 40 tapa la mano** en 360×640: crece 12 px hacia arriba y se come ~7,8 px del pie de las cinco cartas. La vara A2 de APU-1 («la blanda no toca la mano en vertical») sale roja. `apu 360x640` con la hoja: **rojo**.
  2. **La ✕ de mesa 3 en horizontal** (31×30 y 32×30): Z no tiene regla para `.table-three` en apaisado.
  3. **La ✕ de mesa 4 en horizontal** no es la de mesa 5: ya medía 40×39. Z le suma 16 px de ancho por la izquierda (`left: −17px`, contra el «NUNCA a la izquierda» de `gameTable.css:3581-3584`) y el alto se queda en **39**.
  4. **El nombre del panel revelado en el pago** se queda en 42×29–37: lo cortan sus **propias** cartas reveladas. D4 solo cubre al vecino. Su toque es nulo en ese momento (R1.c, `GameTable.jsx:1453-1463`).
- **Hay una variante medida (`cv`)** que cierra 2, 3 y 4 sin tocar ningún protegido: con ella, las 16 páginas de las cuatro celdas que fallaban salen verdes. El 1 no tiene arreglo dentro de Z: es decisión de producto.
- **Tapetes (D3): tapado, no tamaño.** El icono de «Cuenta» (`svg.util-ico-cuenta`, sin ancho ni alto) toma el ancho de la fila (62) y, al ser cuadrado, mide 62 de alto en una fila de 44: desborda 9 px arriba y le roba el pie a Tapetes. No se toca: vuelve al punto 12 como hueco declarado.

## §1 · Paso 0 · Punto de partida (12:20)

| Comprobación | Resultado |
|---|---|
| `git log -1` | `3d1b19e ARN-3e-4: cierre de ARN-3` |
| `git status --porcelain` | los 5 residuos, el informe de la Fase 0 y `laminas/pan1/` |
| `npx vitest run` | **1 312/1 312** (53 archivos) |
| `npx eslint .` | **21** (20 errores, 1 aviso) |
| `node` vivos | ninguno |
| Foto del `.vite` y el `.vite-temp` del repo | 23 entradas (ver §7 sobre lo que escribió el propio vitest) |

## §2 · Paso 1 · La hoja

- `src/styles/tactil.css`: 92 líneas. Las 13 primeras son la cabecera; de la 14 a la 92, el bloque de Z del anexo (`AJILEI_PAN-1_Fase0_Informe_v1.0.md:559-637`). Comprobado con `diff`: idéntico.
- `src/components/GameTable.jsx:76`: `import '../styles/tactil.css'`, detrás de `rec.css` (`:75`).
- Nada más en `src/`.

## §3 · Paso 2 · Lo que la lámina no cubrió

### 3.1 · Mesa 4 en horizontal

Sonda propia (`sonda1b`, en el scratchpad), mesa 4, espera, turno y pago, en las copias sin hoja (`cs`) y con hoja (`cc`), y en la variante (`cv`).

| Celda | ✕ sin hoja | ✕ con Z literal | ✕ con la variante | Fichas de los tres paneles (espera) |
|---|---|---|---|---|
| 640×360 | 40×39 (592..631 × 7..45) | **56×39** (576..631) | **40×41** (592..631 × 5..45) | 29×28 → 41×49, iguales en Z y en la variante |
| 915×412 | 40×39 | **56×39** | **40×41** | 29×29 → 41×50 |

- **La ✕ de mesa 4 no es la absoluta de 15×19 de mesa 5.** Es la ✕ natural (30,63×29) con su pseudo de U4L-SX (`gameTable.css:3585-3592`: `top:-8; right:-10; bottom:-4; left:0`), que ya le daba 40 de ancho. Le falta **1 px de alto**: el pie lo corta `.table-mid` en y=46.
- **Con Z literal** crece 16 px a la izquierda, hasta tocar la cabecera del panel 2 (`div.opp-header ∈panel2`, que pinta encima): no le roba nada a ese panel, pero tampoco gana nada, y cruza el comentario «NUNCA a la izquierda» de mesa 4 (`gameTable.css:3581-3584`) sin necesidad. El alto sigue en 39.
- **Turno y pago:** sin cambios en ningún tocable de los paneles por culpa de la ✕ (los nombres del pago, ver 3.4).
- **La variante:** mesa 4 sale del selector del `left: −17px` y gana `top: −10px` (sube 2 px sobre el hueco muerto de la cabecera). Ver §6, pregunta 2.

### 3.2 · Las celdas que faltaban (corrida completa de `tactil`, con la hoja)

**27/36 páginas verdes, 9 rojas** (9 celdas × 4 mesas: 4 de escritorio + 5 de teléfono por 4 mesas. La ficha decía «21 celdas táctiles»; el rector confirmó que era un error de la ficha y que son 36 páginas). Lo que falla:

| Celda · mesa | Lo que falla | Causa |
|---|---|---|
| 390×844 · m5, m4 | nombre en el pago 42×36 | nombre del panel revelado, cortado por sus cartas (3.4) |
| 412×915 · m5 | nombre 42×35 | ídem |
| 640×360 · m5 | nombre 42×36 | ídem |
| 915×412 · m5 | nombre 42×29 | ídem |
| 640×360 · m4 | ✕ 56×39 · nombre 42×36 | 3.1 · 3.4 |
| 915×412 · m4 | ✕ 56×39 · nombre 42×29 | 3.1 · 3.4 |
| 640×360 · m3 | ✕ 31×30 | **Z no cubre la ✕ de mesa 3 en horizontal** |
| 915×412 · m3 | ✕ 32×30 · nombre 42×29 | ídem · 3.4 |

Las cuatro celdas de escritorio táctil, 360×640 y las mesas 2 de todas las celdas: verdes.

### 3.3 · Tapetes (D3): el diagnóstico

Sonda en el ⋮ abierto, mesas 5 y 2, en 1024×768 y 1280×720 (las celdas de `u1`), 360×640 y 640×360:

| Celda | Tapetes (visible → zona) | «Cuenta» (visible → zona) | Dónde para el barrido de Tapetes por abajo |
|---|---|---|---|
| 1024×768 · 1280×720 · 360×640 | 62×44 → **63×35** | 62×44 → **63×53** | `svg.util-ico.util-ico-cuenta` |
| 640×360 (sin fila de Cuenta) | 62×44 → 62×44 | — | — |

- **No es tamaño: lo tapa el icono de la fila de abajo.** `CuentaIcon` (`UtilitiesMenu.jsx:56-70`) es un `<svg viewBox="0 0 24 24">` sin `width` ni `height`; la regla `.util-ico` solo le da `display:flex` y `font-size` (`menuMovil.css:218-224`, `gameTable.css:5896-5902`). Toma el ancho de la fila (62) y, cuadrado, mide 62 de alto en una fila de 44: desborda (62 − 44)/2 = **9 px** arriba y abajo. La fila de Cuenta va después en el DOM y pinta encima del pie de Tapetes.
- **`u1` 0/8 es solo eso:** en las 8 corridas táctiles, todo pasa (⋮ 44×42, filas 63×44, badge 41×44, ✕ 41×42) salvo `item2` = Tapetes, 63×35.
- **Decisión de D3:** no se toca. Vuelve al punto 12 como hueco declarado, con la causa: el arreglo natural es dar tamaño al SVG de Cuenta, que vive en `UtilitiesMenu.jsx`/`menuMovil.css`, fuera de esta campaña.

### 3.4 · Los nombres del pago y D4

- **D4 funciona y se ejerce:** en las corridas sale contado aparte (`D4 nombre-tap#2 3 px`, `… 13 px`): puntos del barrido de un vecino que caen bajo el `opp-winner` y se cuentan del vecino.
- **Lo que queda bajo 40 es el nombre del propio panel revelado.** La sonda lo identifica en todos los casos: el borde de abajo lo pone `div.opp-cards ∈panel(ganador)`, es decir, **sus propias cartas reveladas**, que pintan encima de su nombre (mismo panel, después en el DOM).
- **Ese toque es nulo:** `opp-winner` es `revealedSeat === seat` (`GameTable.jsx:1893`) y `handleRevealTap` sale sin hacer nada si `revealedSeat === seat` (R1.c, `:1453-1463`).
- **Propuesta (no aplicada):** que `tactil` no mida en el pago el nombre del panel revelado: selector `.opp-panel:not(.opp-winner) .opp-name-tappable`. Ver §6, pregunta 3.

### 3.5 · La ✕ de mesa 3 en horizontal

Sin regla en Z: queda en la base (`gameTable.css:611-620`), 31×30 y 32×30. La variante le aplica el patrón de la ✕ de mesa 2 en horizontal (`position: relative; z-index: 3` y `::after` de −7/−7/−4/−7), que ya está en Z. Ver §6, pregunta 2.

### 3.6 · Otras observaciones

- **915×412 · mesa 2, pago:** la ficha de la IA queda en 41×21 (29×15 sin la hoja). La tapa la carta ganadora **de su propio panel** (`div.playing-card.card-winner ∈panel0`). Preexistente; `tactil` no mide fichas en el pago. Se anota.
- **La forzosa baja de 42 a 40.** La regla de D2 (`.game-table-screen .bankrupt-overlay .bankrupt-modal .btn[data-accion^="recarga-"] { min-height: 40px }`, (0,5,0)) también gana a los `min-height: 42px` de la forzosa (`apu.css:350-353`, `:414-416`, `:451`, (0,4,0)). Medido en 360×640: montos y acciones 42 → 40. La vara de la forzosa (40–44) pasa, y la lámina ya lo mostraba (43 → 41 de zona), pero es un cambio visible que D2 no nombra.

## §4 · Paso 3 · Los vigilantes

Todo en `scripts/diagDSK.mjs` (+91 −30):

1. **`__hitBox` con D4** (`installHitProbe`): opción `{ revelacion: true }`. Si el punto lo pinta un elemento de un `.opp-panel.opp-winner` que no contiene al tocable, se mira la pila entera (`elementsFromPoint`), se saltan los elementos del ganador y, si lo siguiente es el tocable, el punto es suyo. Esos puntos se cuentan aparte (`porRevelacion`). Sin la opción, la sonda es la de siempre: `u1`, `u2` y el resto no cambian.
2. **`tactil`:**
   - las cinco celdas de teléfono en `TOUCH_VPS`;
   - filtro `tactil [celda] [mesa]`;
   - la ✕ (`.btn-leave`) en la espera;
   - D4 en el pago (solo ahí), con `tapadoPorRevelacion` en el JSON;
   - una línea de consola por página (antes no imprimía nada por página).
   - Tapetes **no** entra: D3 salió «tapado».
3. **`apu.6` a propósito** (el de la Fase 0, §C1): mesa nueva, mano 1, turno del humano; la fila y los multiplicadores por `__hitBox`, mesas 2 y 5, piso `TACTIL_MIN` (40). Separado de la tarjeta. **El piso rige solo con `pointer: coarse`:** con ratón (las celdas de escritorio de `apu`) se miden igual, pero solo cuentan el desborde y lo que quede fuera de la ventana (§7).
4. **La tarjeta a 40 (D6).** El punto existía: `VARA_BOTONES` (APU-1 A5) y sus vecinos. Suben de 36 a 40 la blanda (`altoMin`), la compacta (`altoMin`), «Ver la mesa» y `botonesRecarga` del apaisado. La forzosa ya pedía 40.

## §5 · Paso 4 · Controles en copias

Copias en el scratchpad con el método de la 1a (D7): `node_modules` propio con **151 uniones, una por paquete**, sin `.vite` ni `.vite-temp`, y `cacheDir: '.vite-copia'` escrito antes del primer arranque. `cs` = producto sin el `import`; `cc` = con él; `cb` = `git archive 3d1b19e` intacto; `cv` = `cc` más la variante.

| Vigilante | Sin la hoja (`cs`) | Con la hoja (`cc`) | Con la variante (`cv`) |
|---|---|---|---|
| `apu 360x640` | **ROJO**, código 1: `apu.6` (×1 33×27, ×2 33×27, ×5 32×27, ×10 40×27; mesas 2 y 5), `tel.blanda` (36), `tel.forzosa` («Ver la mesa» 36) | **ROJO**, código 1: `tel.blanda` y `tel.recarga`, los dos por **«tapa 3 311,88 px² de la mano»**. `apu.6` verde (×1 41×41, ×2 40×41, ×5 41×41, ×10 44×41) | — (la variante no toca la tarjeta) |
| `tactil 360x640` (4 mesas) | **ROJO**, código 1, las 4 mesas: fichas 28–29×28, ✕ 31×30, multiplicadores 32–40×27, nombres 35–36×39–40 | **VERDE**, código 0 | — |
| `tactil` completo (36 páginas) | — | **ROJO**, 27/36 (§3.2) | las 4 celdas que fallaban (16 páginas): **VERDE**, código 0 |
| La tarjeta (D6) | **ROJO**: blanda 36–36 «fuera de 40–40», «Ver la mesa» 36 | alto **40** en todo; la forzosa 40 (antes 42); **pero la blanda tapa la mano** | — |

**La tarjeta y la mano, en cifras (360×640, mesa 2, automática):**

| | Sin la hoja | Con la hoja |
|---|---|---|
| Tarjeta (top..bottom) | 471..634 (163) | 459..634 (175) |
| Botones | 36 (5) | 40 (5) |
| Pie de las cartas | ≈ 466,8 | ≈ 466,8 |
| Aire / solape | 4,17 de aire | **≈ 7,8 px de solape** (3 311,88 px²) |
| Separaciones (montos · acciones · entre filas · hasta el cronómetro) | 12 · 12 · 14 · 10 | 12 · 12 · 14 · 10 |
| Holgura sobre los mínimos de la vara (10 · 12 · 12 · 8) | 4 px en vertical | — |

Dentro de la tarjeta solo hay 4 px de holgura vertical sobre los mínimos de su propia vara: no caben los 12. Ver §6, pregunta 1.

## §6 · Preguntas para el STOP

1. **La tarjeta automática a 40 tapa la mano en 360×640** (§5). Opciones:
   - (a) aceptar el solape (~7,8 px del pie de las cartas) y relajar la vara A2 de la blanda en vertical;
   - (b) **la tarjeta con el patrón de Z**: botones visibles a 36 y zona de 40 con un `::after` de ±2 (entre botones hay 12 de hueco: caben sin pisarse), y la vara de la tarjeta medida por zona táctil, como `apu.6`. Coherente con «nada de lo que se ve cambia», pero D2 decía «pasan de 36 a 40»;
   - (c) 40 visibles y quitar los 12 px de otro sitio de la tarjeta (rellenos o separaciones), que es rediseñarla.

   Mi recomendación: **(b)**. Y aparte: ¿la forzosa puede bajar de 42 a 40 (§3.6), o la regla de D2 debe excluirla?
2. **Las ✕ de mesas 3 y 4 en horizontal** (§3.1, §3.5). ¿Entra la variante medida (mesa 3 con el patrón de mesa 2; mesa 4 fuera del `left: −17px`, con `top: −10px`)? Deja de ser «Z literal» en esas dos líneas.
3. **El nombre del panel revelado** (§3.4). ¿Lo deja de medir `tactil` en el pago (`.opp-panel:not(.opp-winner) .opp-name-tappable`), por ser un toque nulo (R1.c)? Es la hermana de D4: durante la revelación, el revelado tampoco se mide a sí mismo.
4. **Tapetes** (§3.3) vuelve al punto 12 con la causa nombrada. ¿Se queda ahí, o se abre en PAN-1 dando tamaño al SVG de Cuenta (`UtilitiesMenu.jsx`/`menuMovil.css`, no protegidos)?

## §7 · Paso 5 · Validación

**En el repo (con la hoja y los vigilantes):**

| Comprobación | Resultado |
|---|---|
| `npx vitest run` | **1 312/1 312** |
| `npx eslint .` | **21**: los mismos 21; solo se corren +1 las líneas de `GameTable.jsx` por el `import` |
| `npm run build` | limpio (el aviso de chunks > 500 kB es de 7db208c) |

**Los modos de INV-04 e INV-07, en `cc` (con la hoja), en sus celdas:**

| Invariante | Modo | Resultado en `cc` | Sobre `3d1b19e` (`cb`) |
|---|---|---|---|
| INV-04 | `diagDSK o1` | verde | — |
| INV-04 | `diagDSK o2` | verde (15 celdas) | — |
| INV-04 | `diagDSK h1` | verde | — |
| INV-04 | `diagDSK r1` · `r2` | verdes | — |
| INV-04 | `diagDSK msg` | verde (semillas 1–15, 7/7 jugadas) | — |
| INV-04 | `diagDSK rev` | verde (p1_delta ✓) | — |
| INV-04 | `diagPUE voz2` | verde (222 mediciones, 0 rojas) | — |
| INV-04 · INV-07 | `diagDSK luz` | **rojo** solo en p4_fugas; p1_delta ✓ (el Δ de la mesa) | **el mismo rojo**, con los mismos 4 fallos, con puertos propios y con los de por defecto (5173/5174): **preexistente** |
| INV-07 | `diagDSK tactil` | **rojo**, 27/36 (§3.2) | — (el vigilante es nuevo; su control es §5) |
| INV-07 | `diagDSK u1` | **rojo**: 20/20 celdas, hits 0/8, todos por Tapetes (63×35) | **el mismo rojo, 0/8: preexistente** (punto 12, §3.3) |
| INV-07 | `diagDSK u2` | verde (táctil 4/4) | — |
| INV-07 | `diagDSK menu-movil` | verde | — |
| INV-07 | `diagSAL sal` | verde (102/102) | — |
| INV-07 | `diagDSK lob` | verde (6/6) | — |
| INV-07 | `diagDSK retar` | verde (6/6) | — |
| INV-04 · INV-07 | `diagDSK apu` | **rojo** solo en 360×640 (`tel.blanda` y `tel.recarga`: la tarjeta tapa la mano, §5). Apaisados (640×360, 844×390) y REC-2 (18 casos) verdes; escritorio verde tras corregir `apu.6` (§4.3) | — |

- **`luz` p4_fugas** no encuentra `luz.css` en Portada ni en la sala de espera: la hoja vive en el chunk diferido de la mesa (ARN-3d-ii), y fuera de la mesa solo está si la precarga ya llegó. No es de esta sub-tanda. Hueco para quien lleve el arnés.
- **`apu` completo con el primer `apu.6`** salió rojo en las cuatro celdas de escritorio: allí la página se abre con ratón y la fila mide 33–34 y los multiplicadores 28–29, que es lo diseñado. Corregido (§4.3) y repetido en las cuatro: verdes.

**Δ de anclas en el turno** contra `3d1b19e` (`cs`), mesas 5, 4 y 2, en 360×640, 640×360 y 915×412:
- Con el conjunto de anclas de la lámina (óvalos, paneles, fichas y nombres visibles, `.ai-zone`, cartas, barra, área, cabecera, ✕, ⋮, mesa, zona del humano y scroll): **Δ 0 en las 9 comparaciones del turno y en las 9 de la espera.**
- La sonda mide además los botones de la fila. Ahí salen **dos cambios visibles que Z trae por diseño**, los mismos que mostró la lámina:
  - los multiplicadores pasan de 31,7 a 35,5 de ancho y se recentran (×1 Δx −5,71, ×10 Δx +5,68; solo en vertical);
  - el botón que había quedado con el `:hover` pegado baja 2 px a su sitio (Δy +2): es D5 haciendo su trabajo.
- En el pago, las diferencias son de contenido (quién gana, el saldo) y de la caja del nombre tocable, que crece por dentro con su margen negativo sin mover nada (D7 de la 1a).

**El `.vite` y el `.vite-temp` del repo.** La foto se tomó antes del vitest del Paso 0, y **ese vitest (en el repo, como pide la ficha) reescribió** `node_modules/.vite/vitest/…/results.json` y la fecha de `node_modules/.vite-temp` (12:21:02). El del Paso 5 hizo lo mismo. Ninguna copia escribió en el repo: al cierre, contra la foto inicial, solo difieren esas dos entradas, con las horas del vitest (12:59:54) y del build (13:00:00) del Paso 5; `node_modules/.vite/deps` está intacto. Cada copia guarda su propio `.vite-temp` en su `node_modules`.

## §8 · Paso 6 · El mapa de commits de la primera vuelta

> Sustituido por §11.5.

Si se aprueba tal como está hoy (Z literal), y sin contar lo que cambie con las respuestas de §6:

| # | Commit | Archivos | Conteo |
|---|---|---|---|
| 1 | `PAN-1b: piso táctil Z y sus vigilantes` | `src/styles/tactil.css` (A) · `src/components/GameTable.jsx` (M) · `scripts/diagDSK.mjs` (M) | 3 archivos: +92 · +1 · +91 −30 |
| 2 | `PAN-1b: informes` | `docs/reportes/AJILEI_PAN-1_Fase0_Informe_v1.0.md` (A) · `docs/reportes/AJILEI_PAN-1_1b_Informe_v1.0.md` (A) | 2 archivos: +753 · este |

La puerta del commit 1 («`apu 360x640` verde en su copia») **hoy no se cumple** (§5, pregunta 1).

## §9 · Instrumento y trampas

- **Bash trunca los comandos de más de 8 KB:** la sonda se escribió con Write (ya estaba en la memoria).
- **`apu` completo y `apu 360x640` escriben el mismo `capturas-dsk/diag_apu.json`** en la copia: hay que copiarlo antes de que la corrida larga lo pise.
- **`luz` p4_fugas con 14 procesos en paralelo** (§7).
- **`apu.6` y el puntero:** el primer `apu.6` aplicaba el piso de 40 también en las celdas de escritorio, que `apu` abre con ratón. El piso rige con `pointer: coarse`; con ratón solo cuentan el desborde y lo que quede fuera de la ventana.
- **La foto del `.vite`** se tomó antes del vitest del Paso 0, que también escribe en el repo (§7). La próxima vez: foto después del vitest inicial.
- **`until … || exit 1` dentro de un `for`** mata el shell entero, no la condición: hay que envolverla en una función.

## §10 · Cierre

Comprobado a las 13:22:
- **Puertos 4170–5599:** solo `0.0.0.0:5040`, PID 7724 (el `svchost`).
- **`node` vivos:** ninguno.
- **Copias** (`cs`, `cc`, `cb`, `cv`, en el scratchpad): las 151 uniones de cada una quitadas con `[System.IO.Directory]::Delete(…, $false)`; quedan 0, y en su `node_modules` solo su `.vite-temp` y el `.package-lock.json` copiado. Las carpetas se quedan en el scratchpad.
- **`node_modules` del repo:** intacto (154 entradas; `vite`, `react` y `playwright-core` presentes).
- **`.vite` del repo:** §7.
- **`git status`:** `scripts/diagDSK.mjs` y `src/components/GameTable.jsx` modificados; `src/styles/tactil.css`, este informe y el de la Fase 0 sin rastrear; los 5 residuos y `laminas/pan1/` fuera. HEAD en `3d1b19e`. Sin `git add`.
- **Fuera del repo:** `sonda1b.mjs`, `delta.mjs`, `corre.sh`, los logs y los JSON (`out/`), en el scratchpad.

Primera vuelta parada aquí, en el STOP del Paso 6. Las respuestas de §6 llegaron: sigue §11.

## §11 · Segunda vuelta · Las respuestas del rector (desde las 14:02)

### 11.1 · Lo que contestó el rector a §6

1. **La tarjeta: opción (b).** Se retira el `min-height: 40px` de D2. Los botones de la tarjeta que midan menos de 40 conservan su caja visible y ganan una zona táctil de 40 con un `::after` transparente, por especificidad. La forzosa no cambia: sigue en 42. La vara de la tarjeta mide la zona táctil ≥ 40 y conserva la caja visible de hoy. A2 tiene que salir verde.
2. **Entra la variante `cv`** para las ✕ de mesa 3 y de mesa 4 en apaisado, documentada como «no Z literal».
3. **Sí:** en el pago, `tactil` no mide el nombre del panel revelado, nombrado junto a D4.
4. **Tapetes se queda en el punto 12**, como hueco declarado con su causa (el SVG de Cuenta sin tamaño). `u1` sigue rojo de forma preexistente.

Además: las «21 celdas» de la ficha eran un error de la ficha (son 36 páginas), y `luz` p4_fugas queda anotado como preexistente para ARN-4.

### 11.2 · Lo que cambia en la hoja: las tres reglas que dejan de ser Z literal

Cada una lleva en `tactil.css` la marca **«NO ES Z LITERAL»**, y la cabecera las nombra.

| Regla | Z literal (anexo de la Fase 0) | Ahora | Especificidad |
|---|---|---|---|
| ✕ de mesa 3, apaisado | sin regla | se suma al selector de la ✕ de mesa 2: `position: relative; z-index: 3` y `::after` −7 / −7 / −4 / −7 | (0,4,0) · (0,4,1) |
| ✕ de mesa 4, apaisado | `.table-four … .btn-leave::after { left: -17px }` (con mesa 5) | fuera de ese selector; `::after { top: -10px }`. Mesa 5 conserva su `left: -17px` | (0,4,1) > (0,2,1) de `gameTable.css:3585` |
| La tarjeta de recarga (D2) | `.btn[data-accion^="recarga-"] { min-height: 40px }` | `position: relative` y `::after` con `top/bottom/left/right: min(0px, calc(50% − 20px))` | (0,5,0) · (0,5,1) |

**La tarjeta, en detalle.** El `min()` solo crece lo que falta: un botón de 36 gana 2 px arriba y 2 abajo; la forzosa (42) y cualquier botón de ≥ 40 se quedan como están. Los porcentajes se calculan sobre el padding-box del botón, y la zona sale de 40 justos contando el borde. La regla no va bajo `(pointer: coarse)`, igual que la de Z a la que sustituye: con ratón no cambia nada visible. En la tarjeta no hay otro `::after` con el que chocar (`.btn-mult::after` solo existe bajo `.mult-row`).

### 11.3 · Lo que cambia en los vigilantes (`scripts/diagDSK.mjs`)

- **`VARA_BOTONES`:** las cajas visibles vuelven a la vara de `3d1b19e` (blanda 36–40, compacta 36–44, forzosa 40–44). Cada lámina lleva además `zona: 40`.
- **`medirBotonesRecarga`:** mide la zona táctil de cada botón y la de «Ver la mesa» con el mismo barrido en cruz de `__hitBox`. Devuelve `zonaAncho`/`zonaAlto` por botón, `zonaMin` y `bajoZona`.
- **`varaBotones`:** falla con «zona táctil bajo 40: …». «Ver la mesa» pide caja ≥ 36 **y** zona ≥ 40.
- **`botonesRecarga` en apaisado:** caja 36–40 y zona ≥ 40. La línea de consola imprime la zona mínima.
- **`REC_VER_MESA` (modo `rec`):** mide también la zona, porque su resultado sustituye al `verMesa` de `medirBotonesRecarga` y pasa por la misma vara.
- **`tactil`:** en el pago mide `.opp-panel:not(.opp-winner) .opp-name-tappable`. El comentario, junto a D4, lo justifica: el nombre del panel revelado lo cortan sus propias cartas, y tocarlo no hace nada (R1.c, `GameTable.jsx:1453`). El toque funcional del modo (`revealTap`) ya excluía al ganador.

### 11.4 · Controles (en copias)

Las mismas copias `cs` (sin el `import`) y `cc` (con él), sincronizadas con el árbol del repo y con **151 uniones por copia recreadas**. Su `cacheDir: '.vite-copia'` sigue en su `vite.config.js` desde el primer arranque. `cb` y `cv` ya no se usan.

| Vigilante | Sin la hoja (`cs`) | Con la hoja (`cc`) |
|---|---|---|
| `apu 360x640` | **ROJO**, código 1: `apu.6` (×1 33×27, ×2 33×27, ×5 32×27, ×10 40×27, en mesas 2 y 5); `tel.blanda` («zona táctil bajo 40»: los cinco botones a 36 de alto; «Ver la mesa» 120×36); `tel.forzosa` («Ver la mesa» 120×37) | **VERDE**, código 0 (424 s) |
| `tactil 360x640` (4 mesas) | **ROJO**, código 1, las 4 mesas: fichas 28–29×28–29, ✕ 31×30, multiplicadores 32–40×27, nombres 35–36×39–40 | — |
| `tactil` completo | — | **VERDE, 36/36**, código 0 (1 247 s) |

**La tarjeta en 360×640 con la hoja:**

| | Blanda (automática) | Forzosa |
|---|---|---|
| Tarjeta (top + alto) | 471 + 163, **igual que sin la hoja** | 152,59 + 334,8, igual |
| Caja de los botones | 36 (los cinco) | **42**: no cambia |
| Zona táctil mínima | 36 → **40** | 43 → 43 |
| «Ver la mesa» (caja → zona) | 36 → 120×**40** | 36 → 120×**41** |
| Lo que tapa de la mano | **0 px²**: A2 verde | 24 591,88 px², la de siempre: la forzosa no tiene vara A2 |

**`apu.6` con la hoja:** ×1 41×41, ×2 40×41, ×5 41×41, ×10 44×41; la fila de acciones, 60–89×41.

**`tactil` completo, las celdas que fallaban en la primera vuelta:**

| Celda · mesa | ✕ (caja → zona) | Nombres en el pago | D4 contado |
|---|---|---|---|
| 640×360 · m3 | 30,6×29 → **40×42** | 42×42 | — |
| 915×412 · m3 | 30,6×29 → **41×42** | 42×42 | `nombre-tap` 13 px |
| 640×360 · m4 | 30,6×29 → **40×41** (592..631: no cruza a la izquierda) | 42×42 ×2 | — |
| 915×412 · m4 | 30,6×29 → **40×41** | 42×42 ×2 | — |
| 640×360 · m5 | 15×19 → 40×45 | 43×42 ×3 | `nombre-tap#2` 3 px |
| 915×412 · m5 | 15×19 → 40×45 | 42×42 ×3 | `nombre-tap#2` 9 px |

**Δ de anclas contra `3d1b19e`** (sonda `sonda1b`, mesas 4 y 3, 640×360 y 915×412: lo que esta vuelta cambia en la mesa):
- espera: **Δ 0** en las cuatro;
- turno: solo `accion0` Δy +2, que es D5 (el hover pegado), igual que en la primera vuelta;
- pago: diferencias de contenido (quién gana, el saldo de la barra) y la caja del nombre tocable, que crece por dentro con su margen negativo (D7 de la 1a).
- La ✕ visible no se mueve en ninguna.

### 11.5 · Paso 5 · Validación, repetida

**En el repo** (con la hoja y los vigilantes de esta vuelta):

| Comprobación | Resultado |
|---|---|
| `npx vitest run` | **1 312/1 312** (53 archivos) |
| `npx eslint .` | **21**, idénticos línea a línea a los del Paso 5 de la primera vuelta |
| `npm run build` | limpio (el aviso de chunks > 500 kB es de 7db208c). Las tres reglas nuevas están en `GameTable-*.css`; el minificador junta las cuatro de la tarjeta en `inset: min(0px, 50% - 20px)`, que es lo mismo |

**Los modos, en `cc`:**

| Invariante | Modo | Resultado |
|---|---|---|
| INV-04 | `o1` · `o2` · `r1` · `r2` · `rev` | verdes |
| INV-04 | `h1` | primera corrida **roja** en 1/16 (m5 1920×937, `headsStable`: «IA 4» cardsY 3,41 y ancho de cabecera 12,61 en `h2-post`), con 8 procesos en paralelo. Desempate, repetido a la vez en `cc` y en `cs`: **`cc` 16/16 verde; `cs` (sin la hoja, el producto de `3d1b19e`) rojo en 3/16 con la misma firma** (cardsY 3,62, ancho de cabecera 11–25). Es un intermitente preexistente del producto o del instrumento, no la hoja: con ratón, de `tactil.css` solo aplica la regla de la tarjeta |
| INV-04 | `msg` | verde (ver 11.7: `lob` recompiló su `dist` a mitad) |
| INV-04 | `diagPUE voz2` | verde (222 mediciones, 0 rojas) |
| INV-04 · INV-07 | `luz` | **rojo solo en p4_fugas**, igual que en la primera vuelta y que en `3d1b19e`: preexistente (ARN-4). `p1_delta` ✓ |
| INV-07 | `tactil` | **verde, 36/36** (11.4) |
| INV-07 | `u1` | **rojo, el mismo de siempre**: las 8 corridas táctiles fallan solo en `item2` = Tapetes 63×35 (punto 12) |
| INV-07 | `u2` · `menu-movil` | verdes |
| INV-07 | `diagSAL sal` | verde (102 contextos) |
| INV-07 | `lob` · `retar` | verdes (6/6 y 6/6) |
| INV-04 · INV-07 | `apu` completo | **verde**: las 9 celdas y los 18 casos de REC-2. En apaisado, `botonesRecarga` da caja 36, **zona mínima 40** y solape 0 |
| INV-07 | `rec` | **verde**: 13 escenas con solape 0, Δ 0 y velo 0, las 4 de la burbuja (p3–p7) y el anillo. «Ver la mesa» pasa ya por la vara de zona |

### 11.6 · Paso 6 · El mapa de commits

| # | Commit | Archivos | Conteo |
|---|---|---|---|
| 1 | `PAN-1b: piso táctil Z y sus vigilantes` | `src/styles/tactil.css` (A) · `src/components/GameTable.jsx` (M) · `scripts/diagDSK.mjs` (M) | 3 archivos: +113 · +1 · +124 −37 |
| 2 | `PAN-1b: informes` | `docs/reportes/AJILEI_PAN-1_Fase0_Informe_v1.0.md` (A) · `docs/reportes/AJILEI_PAN-1_1b_Informe_v1.0.md` (A) | 2 archivos: +753 · este |

**Puerta del commit 1:** `apu 360x640` verde y `tactil` completo 36/36 verde, los dos en su copia (11.4). **Se cumple.** Fuera de los dos commits: `laminas/pan1/` (D8), los cinco residuos (`AJILEI_MOT-1_*`, `laminas/mon1/*`) y nada más. En `git add` solo van rutas explícitas.

### 11.7 · Trampas de esta vuelta

- **Dos modos de preview en la misma copia a la vez.** `lob` decidió recompilar (`vite build`) el `dist` de `cc` a las 14:41:21, mientras `msg` lo servía en preview desde las 14:27. Era el mismo árbol, así que el contenido no cambió, pero hubo una ventana con el `dist` vaciado. `msg` salió verde: un fallo de carga lo habría puesto en rojo, no en verde. La próxima vez: los modos de preview (`msg`, `lob`, `retar`, `luz`, `diagPUE`), en serie o en copias distintas.
- **h1 con 8 procesos en paralelo** dio un rojo aislado que el desempate atribuye al producto de `3d1b19e` (11.5). El desempate se hizo como manda la doctrina: las dos copias a la vez y con la misma carga.
- **Un cambio de comentario en `tactil.css` a mitad de las corridas** (la referencia «§5» de la regla de la tarjeta) se copió a `cc` con servidores vivos. Las reglas eran las mismas, y el HMR vuelve a inyectar la hoja sin ninguna diferencia de estilo.
- **La vara de zona no es exacta al píxel:** sin la hoja, «Ver la mesa» de la forzosa da 120×37, no 36. El barrido es de píxel entero desde un centro redondeado. El piso es 40, así que no cambia ningún veredicto.

### 11.8 · Cierre de la segunda vuelta (15:27)

- **`node` vivos:** ninguno. **Puertos 4170–5599:** solo `0.0.0.0:5040` (PID 7724, `svchost`).
- **Copias `cs` y `cc`:** las 151 uniones de cada una quitadas con `[System.IO.Directory]::Delete(…, $false)`; en su `node_modules` quedan solo su `.vite-temp` y el `.package-lock.json`. Las carpetas se quedan en el scratchpad.
- **`node_modules` del repo:** intacto (154 entradas; `vite`, `react` y `playwright-core` presentes).
- **`.vite` del repo:** contra la foto de las 14:05, solo cambian `results.json` (14:14:50, el vitest de 11.5) y la fecha de `.vite-temp` (15:11:59, el build de 11.5). `node_modules/.vite/deps` sigue intacto.
- **`git status`:** `scripts/diagDSK.mjs` y `src/components/GameTable.jsx` modificados; `src/styles/tactil.css`, este informe y el de la Fase 0 sin rastrear; los cinco residuos y `laminas/pan1/` fuera. HEAD en `3d1b19e`. Sin `git add`.

Parada en el STOP del Paso 6. El rector dio el «OK mapa».

### 11.9 · Paso 7 · Los commits y su comprobación

- **Commit 1, `8009d4f` `PAN-1b: piso táctil Z y sus vigilantes`:** `tactil.css` (A, +113), `GameTable.jsx` (M, +1), `diagDSK.mjs` (M, +124 −37), con rutas explícitas. Comprobado en una copia limpia (`k1`, `git archive 8009d4f`, 151 uniones, `cacheDir: '.vite-copia'` antes del primer arranque):
  - **vitest 1 312/1 312.** La primera corrida dio 1 311 y 1 saltada: `testBancoBandas` se salta en voz alta sin los 75 volcados de APU-1, que no están en git (ARN-3a). Copiados los 75 volcados del índice, 1 312/1 312.
  - **`apu 360x640` verde** (código 0, 290 s): blanda 36–36 con aire, forzosa 42–42. La primera corrida abortó con código 2 en 33 s (`waitForSelector`): a la copia le faltaba `.env.local`, que no está en git. Copiado del repo (es el mismo que tenía `cc`), verde.
- **Commit 2, `PAN-1b: informes`:** el informe de la Fase 0 (A) y este (A), con rutas explícitas. Se comprueba con vitest en su copia.

### 11.10 · Anotado para ARN-4 (rector)

- **`luz` p4_fugas** rojo en `3d1b19e`: `luz.css` vive en el chunk diferido de la mesa y no está en Portada ni en la sala de espera (§7).
- **El intermitente de h1** (`headsStable`): en `3d1b19e` sin la hoja, 3/16 rojas con la misma firma, las cartas de una IA bajan ~3,6 px y su cabecera cambia de ancho 11–25 px en `h1-post`/`h2-post` (11.5).

El push lo hace Victor.
