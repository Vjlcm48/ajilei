# AJILEI · PAN-1 · Pantalla completa y piso táctil · Fase 0 · Informe v1.0

- **Fecha:** 2026-10-03, de 09:34 a 10:10 (36 min de un tope de 90).
- **Base:** `main` en `3d1b19e` (ARN-3e-4). En el árbol, solo los 5 residuos conocidos (los 2 informes de MOT-1 y los 3 archivos de `laminas/mon1/`).
- **Tipo:** Fase 0, solo lectura. En el repo solo se escribe este informe. Sin commits ni `git add`.
- **Instrumento:**
  - una copia del árbol en el scratchpad (`git ls-files -co --exclude-standard`, con `.env.local` y una unión a `node_modules`);
  - una sonda efímera, `sondaPAN.mjs` (modos `tocables`, `franjas`, `alto`, `recarga`, `fs` y `hover`), que importa el terreno común **de la copia** (`scripts/arnes/comun.mjs` y `scripts/rutaMesa.mjs`) y levanta su propio servidor;
  - los dos vigilantes propuestos (`tactil` y `apu.6`), parcheados **solo en la copia**.

  Chromium 151.0.7922.34 del arnés y aislamiento D6 en verde en todas las corridas.
- **Servidor:** `apu` y `tactil` son modos de desarrollo (`MODOS_PREVIEW` solo contiene `lob` y `msg`: necesitan el bypass y los moldes `?apu=`). Por eso todo se midió con el servidor de desarrollo **de la copia**, dentro del proceso, en los puertos 5173 y 5175–5179. No hubo build ni preview. Lo que se mide es CSS y geometría, idénticos en las dos vías.

---

## §0 · Resumen en siete líneas

1. **La fila de acciones de 360×640 ya cumple INV-07 por zona táctil.** Mide 28 px visibles, y el `::after` de BT-1 (`gameTable.css:2054-2062`, −3/+9) la lleva a **40 px efectivos** (barrido en cruz: 59×40, 89×40, 79×40). El aplazado 21 confundía la caja visible con la zona táctil.
2. **Lo que de verdad incumple en 360×640** son estos tocables:

   | Tocable | Zona efectiva (px) |
   |---|---|
   | Multiplicadores ×1…×10 | 24,5–26 de alto |
   | ✕ | 31×29 |
   | Fichas de las IAs | 28×28 (25,5 cuando el panel siguiente las tapa) |
   | Nombres tocables del pago | ≈35×39 |
   | Dos filas del ⋮ | 34,5 y 26 |

   El modo `tactil` corregido lo ve en rojo.
3. **«Salir con mis fichas» no mide 28 px**: mide **42** en las cinco celdas. La tarjeta automática mide **36** en todo, que cumple `APU-1_Reglas_v1.3:217` (36) pero no INV-07 (40). Es un conflicto de normas para el rector.
4. **Hay dos caminos para el piso táctil, y los dos caben fuera de `gameTable.css`:**
   - **(2), solo la zona táctil:** cubre todos los tocables, con Δ 0 en todo lo demás. Con él, los dos vigilantes corregidos pasan de rojo a verde en 360×640 (C1, C2). El resto de celdas de teléfono y el escritorio táctil de la ✕ se afinan en 1b.
   - **(1), el botón visible a 40:** cabe solo para los tres botones de la fila (Δ 0, con `flex-wrap: nowrap`). Para los multiplicadores no hay sitio sin achicar las cartas o rehacer la barra.

   **No hace falta abrir `gameTable.css`.**
5. **La pantalla completa sí mueve los óvalos**, porque el alto crece:
   - en mesas 3 y 2 vertical, el óvalo **crece** (`calc(100svh − estática)`): +100 px en 360×640→740;
   - en mesas 5 y 4, el óvalo **baja** (va centrado en la banda `1fr`): +50 px.
   - en un teléfono de 360×780 (pestaña ≈680), el alto **cruza el corte `max-height: 772px`** del bloque comprimido. Toda la mesa cambia de régimen: carta 51→61, botones 28→40 visibles, óvalo +23 a +26 de alto y la cabecera de mesa 5 +32;
   - en escritorio, 1440×789→900 cruza `min-height: 900`: carta 76→91 y el óvalo de mesa 5 **−70,41 px de ancho**.

   Todo vuelve idéntico al salir. Es un cambio de viewport, no de contenido, pero toca INV-04. **Pregunta al rector.**
6. **La cadena del gesto es síncrona entera** (CTA → `cta.onClick` → `onRetar` → `marcarEntradaMesa` → `startTransition`). La llamada va en la primera línea de `onRetar` (`App.jsx:540`). Todas las salidas de la mesa pasan por `salir()` → `onLeave` (`App.jsx:526-530`). Hoy no existe nada de pantalla completa en `src/`.
7. **Un hallazgo de producto aparte:** `.btn:hover` (`gameTable.css:497`) no está protegido con `(hover: hover)`. En táctil, el botón tocado se queda 2 px arriba y le roba la zona al vecino (de ahí el 37,5 del horizontal). Se arregla fuera del protegido.

---

## §A · Pantalla completa: el mapa

### A1 · El gesto

La cadena, de punta a punta y **sin un solo `await`**:

| Paso | Dónde | Qué hace |
|---|---|---|
| 1 | `src/components/PantallaChips.jsx:112-115` | `<button data-accion="cta" onClick={cta?.onClick}>` |
| 2 | `src/screens/RetarIAS.jsx:189-194` | `MEMORIA_RETO.guardar(config)` (síncrono, `localStorage`) → `onRetar?.({…})` |
| 3 | `src/App.jsx:540` | `onRetar={(elegida) => {` |
| 4 | `src/App.jsx:552` | `marcarEntradaMesa()` (síncrono) |
| 5 | `src/App.jsx:553` | `startTransition(() => { setSaldoSesion…; setMesa…; setScreen('table') })` |

- **La mesa diferida de ARN-3d no rompe el gesto.** `startTransition` se llama de forma síncrona. Lo que puede esperar al chunk es el *commit* de la pantalla, no la llamada. Si el chunk no llegó, React deja Retar puesta hasta que llega.
- **Dónde engancharla:** primera sentencia de `onRetar` en `App.jsx:540`, antes de `marcarEntradaMesa()`. Se descarta `RetarIAS` (la pantalla no conoce la mesa) y se descarta el montaje de `GameTable` (ya fuera del gesto).
- **Medido en el Chromium del arnés (modo `fs`):**
  - `requestFullscreen` dentro del clic síncrono → entra;
  - 300 ms después del gesto → entra (la activación transitoria de Chromium dura unos 5 s);
  - **6 s después → `TypeError`**.

  La regla «síncrono dentro del gesto» no es un capricho. En Safari y Firefox la ventana es más corta, así que la llamada va en el mismo tic.
- **Límite del instrumento:** `page.evaluate` de Playwright cuenta como gesto (`userGesture: true`), así que «sin gesto» sale «entra» y no prueba nada. Y en Chromium sin cabeza **el alto no cambia al entrar** (640→640, y `display-mode: fullscreen` sigue en `false`). Por eso el efecto en el diseño se midió emulando las dos alturas (A4), no entrando de verdad.

### A2 · Lo que ya existe

- **`grep` en `src/`** de `requestFullscreen`, `fullscreenchange`, `exitFullscreen`, `fullscreenElement`, `screen.orientation`, `display-mode`, `navigator.standalone` y `standalone`: **cero resultados**.
- **Manifiesto** (`public/manifest.webmanifest:6-7`): `"display": "standalone"`, `"orientation": "any"`.
- **iOS** (`index.html:73-84`): `apple-mobile-web-app-capable`, `black-translucent`, `apple-mobile-web-app-title` y `mobile-web-app-capable`.
- **Hoy la app no sabe si corre instalada.** El gancho tendrá que preguntarlo:
  - `matchMedia('(display-mode: standalone)')` o `('(display-mode: fullscreen)')`;
  - `navigator.standalone === true` en iOS.

### A3 · La salida

**Todas las salidas de la mesa pasan por un solo sitio:** `salir()` (`GameTable.jsx:470`) → `onLeave` (`App.jsx:526`) → `setScreen('retar-ias')` (`App.jsx:529`). Ojo: la mesa vuelve a **Retar**, no al lobby.

| Caso | Hoy | Con pantalla completa (lo que haría falta) |
|---|---|---|
| ✕ → «Abandonar mesa» | `GameTable.jsx:2152` abre el modal; `:2703-2706` → `salir()` | salir de pantalla completa en `onLeave` |
| Fin de partida, victoria | `PantallaVictoria onLeave={salir}` (`:2177`) | ídem |
| Fin de partida, derrota | «Salir de la mesa» `onClick={salir}` (`:2192`) | ídem |
| «Salir con mis fichas» (forzosa rechazada o vencida) | `rechazarRecarga` → `if (eraForzosa) salir()` (`:1153-1163`) | ídem |
| Gesto de atrás de Android | **No hay historial propio**: nada hace `pushState` en `src/` (solo `replaceState` en `salaPendiente.js:171`). En una pestaña, atrás **abandona el sitio**. | En pantalla completa, el primer atrás lo consume el navegador para salir de ella (a verificar en el S25). La mesa sigue; no hay que hacer nada |
| Esc (escritorio) | La mesa escucha Esc para VOZ-2 (`GameTable.jsx:1261`, `:1267`) y el ⋮ (`useUtilitiesMenu.js:303`) | En pantalla completa, Esc lo consume el navegador para salir. Que la página reciba o no ese `keydown` es a verificar. El Esc que cierra el ⋮ podría no llegar |
| Bloqueo de pantalla (`useCongelado`, `GameTable.jsx:400`) | La mesa se congela y al volver sigue | Android sale de la pantalla completa al ocultar la pestaña (a verificar en el S25). **Reentrar exige otro gesto.** |
| Modales y burbuja de recarga | `position: fixed` dentro del documento | Siguen dentro: el elemento en pantalla completa es `documentElement`. Nada que hacer |

**Efectos colaterales de entrar o salir con la mesa viva.** Cambiar de pantalla completa dispara `resize`, y hay siete oyentes que reaccionan:

| Oyente | Qué hace al `resize` |
|---|---|
| `useCelebracion.js:130` | **corta la celebración** |
| `useUtilitiesMenu.js:308` | cierra el ⋮ |
| `useReacciones.js:122` | cierra su selector |
| `useTapetes.js:145` | cierra el panel |
| `useConsultas.js:65` | cierra el aviso |
| `CuentaPanel.jsx:43` | cierra la cuenta |
| `Voz2Capa.jsx:52` | recoloca la capa de VOZ-2 |

Es el comportamiento esperado ante un cambio de tamaño. Lo único con coste visible es el corte de la celebración.

**Regla propuesta, como pregunta (F1):** se entra al tocar «Retar»; se sale en `onLeave`, es decir, en cualquier salida de la mesa; **no se reentra sola** (si el jugador sale con atrás, Esc o un bloqueo, la mesa sigue en pestaña normal hasta el próximo «Retar»).

### A4 · El efecto en el diseño

**Unidades.**
- Pantalla: `.game-table-screen { height: 100dvh }` (`gameTable.css:6`).
- El modelo O1 vertical usa `100svh` en tres sitios:
  - `:1402`, el colchón de mesas 5/4;
  - `:1628`, el óvalo de mesa 3: `height: max(96px, calc(100svh − var(--o1-static3-v)))`;
  - `:1981`, el óvalo de mesa 2.
- En el horizontal, `--hcards-vspace: calc(45dvh − 40px)` (`:2859`).
- `svh` se eligió para que la barra del navegador, al plegarse, no mueva el óvalo (`:1219-1220`). **La pantalla completa sí cambia `svh`**: deja de haber barra de direcciones y de navegación.

**Medido en la copia** (modo `alto`, mano 1, turno del humano: cambio de alto **en vivo** en la misma página, vuelta al alto inicial y Δ de cada ancla). En las siete parejas y las cuatro mesas, **la vuelta es idéntica** a la medida inicial.

| Pareja (pestaña → pantalla completa) | Mesas 5 y 4 | Mesas 3 y 2 | Además |
|---|---|---|---|
| 360×640 → 740 | óvalo **Δy +50**, tamaño igual; humano Δy +100 | óvalo **Δh +100**; humano Δy +100 | — |
| 412×835 → 915 | óvalo Δy +40 | óvalo **Δh +80** | — |
| **360×680 → 780** (S25: 1080×2340 a DPR 3) | cabecera de m5 **Δh +32**; paneles Δy 17–21 (Δw −1); óvalo **Δy +24/+26, Δh +23** | m3: paneles Δh +16, óvalo Δh +23; m2: `.ai-zone` Δh +15, óvalo Δh +26 | **`max-height: 772px` deja de aplicar**: `--card-w` 51→61; humano Δh +41; área Δh +25,84; **botones 28→40 visibles** |
| 640×304 → 360 (horizontal) | óvalo Δy +30,81, tamaño igual; humano Δh +25,18 | ídem; m2: panel Δh +30,82 | — |
| 915×356 → 412 (horizontal S25) | óvalo Δy +30,79; cartas Δh +20,4 | ídem; m2: panel **Δw +72,11** | — |
| 1920×937 → 1080 | **toda la mesa Δy +71,5, sin un cambio de tamaño** | ídem | — |
| **1440×789 → 900** (portátil de 1440×900) | **cruza `min-height: 900`**: carta 76→91; óvalo **Δx +35,2, Δw −70,41**; paneles Δw ±23/−39 | m3: óvalo Δw −24,5; m2: óvalo **Δh −27**, `.ai-zone` Δh +24 | humano Δh +38 |

**Lectura:**
- **No hay un re-layout en `resize` escrito por la app.** Todo es CSS que sigue al viewport, y la vuelta es exacta: entrar y salir no deja nada movido.
- **Pero el óvalo cambia de geometría al entrar y al salir.** En 3/2 crece; en 5/4 baja. Y donde el alto cruza un corte (772 en vertical, 900 en escritorio), cambia la mesa entera. INV-04 dice «ni geometría». La lectura con la que se hizo O1 es «nada se mueve **por el contenido**», y un cambio de viewport es de la misma familia que girar el teléfono. **Es pregunta al rector (F2), no lo decido yo.**
- **El momento de la entrada importa.** Con la llamada en el gesto, la transición a la mesa y la animación de pantalla completa de Android ocurren a la vez: la mesa puede pintarse un instante al alto de la pestaña y luego saltar. Chromium sin cabeza no cambia de alto, así que **no se puede medir aquí**. Va a la validación en el S25 (E, 1c).

### A5 · La orientación

`screen.orientation.lock()` solo funciona dentro de la pantalla completa en Android (y no existe en iOS Safari). El manifiesto declara `"orientation": "any"`. Es una posibilidad, **no se propone por defecto**. Pregunta F3.

### A6 · Escritorio y PvP

- **Escritorio (1920×937 → 1080):** la mesa entera se traslada +71,5 en bloque, sin cambiar un tamaño (está centrada, `.game-table = min(1100px, 100%)`).
- **En 1440×900 cruza el escalón de `min-height: 900`**: carta 76→91 y óvalo −70,41 de ancho. Es el mismo escalón que vigila el centinela 1440×850 de O2.
- En escritorio la API no tiene las barras de un teléfono que esconder: gana unos 140 px de alto y ningún píxel de ancho. Pregunta F4: ¿se ofrece en escritorio, y si sí, por el mismo gesto?
- **PvP:** `PartidaPvP` es un stub (`App.jsx`, «SAL-B2 F1b»). Si el gancho es un núcleo puro más dos llamadas (`entrar()` en el gesto y `salir()` al dejar la mesa), `onPartida` podría llamarlo igual. No se construye nada para ella.

---

## §B · Piso táctil: el censo

**Método.**
- **Zona efectiva:** barrido en cruz con `elementFromPoint` desde el centro, a pasos de 0,5 px (el `__hitBox` de `tactil`/`u1`), más la cobertura del cuadro de 40×40 centrado.
- **Escenas:** mano 1 de mesa 5 (`opp-panel`) y mesa 2 (`.ai-zone`), en espera, turno del humano (con TURNO y cronómetro vivos, D7), descarte, pago (+4,2 s, fin de la revelación) y ⋮ abierto.
- **Celdas:** las 7 de la ficha. Las de teléfono con `hasTouch` + `isMobile` (pointer coarse). 1920×937 dos veces: con ratón (fino) y como escritorio táctil (`1920x937c`, coarse).
- **Mesas 5/4/3:** el control de `tactil` en la copia (C2) las recorrió las cuatro en 360×640, con el mismo resultado.

### B1 y B2 · Censo y medidas

Zona efectiva, ancho × alto en px. «vis» es la caja visible. **En negrita, lo que queda por debajo de 40 en algún eje.**

| Tocable | 360×640 v | 390×844 v | 412×915 v | 915×412 h | 640×360 h | 1920×937 coarse | Regla que le da el tamaño | ¿Protegido? |
|---|---|---|---|---|---|---|---|---|
| Fila de apuesta («Pasar», «Apostar N», «Retirarse», «Igualar», «Subir») | vis ×28 → **59×40, 89×40, 79×40** | vis ×40 → ×40 | ×40 | vis 150×28 → 150×40, **el de arriba 150×37,5** (ver B5) | ídem 37,5 | vis ×33 → ×40 | v comprimido: `gameTable.css:2054-2062` (BT-1: `min-height: 0` + `::after` −3/+9). v holgado: `:1941` (`min-height: 40px`). h: `:3212-3231` (BT-L, 28 + `::after` ±6). Escritorio: `:4314-4324` (B2, ±3,5) | sí |
| Multiplicadores ×1 ×2 ×5 ×10 | vis 31,7×26 → **31,5×24,5 / 32×26** (×10: 38,5×26) | **31,5–38,5 × 26** | ídem | vis 30×23 → **39,5×22,5** | ídem | 45×40 | base `:527-537`, v `:1942` (`padding: 5px 8px`), h `:3274-3303` (MT-1: «táctil V ≈23» declarado), escritorio `:4338-4346` | sí |
| «Iniciar mano», «Sin descartar», «Siguiente mano» | vis ×28 → ×40 | vis ×40 | vis ×40 | vis ×40 | vis ×40 | vis ×33 → ×40 | los mismos de la fila | sí |
| ✕ (abandonar) | vis 30,63×29 → **31×29** | **31×29** | **31×29** | m5: vis 15×19 → 24×45 (**24 de ancho**); m2: **32×28** | ídem | **31×29** | base `:611-620`; h m5 `:3356-3373`; m2 h `:3934`. **Sin pseudo en vertical ni en escritorio táctil** | sí |
| ⋮ | 44×44 | 44×44 | 44×44 | 44×44 | 44×44 | 43×42 | `menuMovil.css:107-150` (D3) · `gameTable.css:5821-5843` | `menuMovil.css` no |
| Ficha de la IA (`opp-corner-chip`) | vis 28×28 → **28×28**; fila de arriba de m5 **28×25,5** (el panel siguiente la tapa) | **28×28** | **28×28** | **28×28** | **28×27,5** | 40×40 | `opponentPanel.css:505-517` (`padding: 6px` + icono 16, `z-index: 2`). Pseudo solo en escritorio táctil: `gameTable.css:4547` | sí |
| Nombre tocable de la IA (pago) | **≈36×39** (control `tactil`) | — (sin pago en la vuelta) | **35×39; uno 35×34** | **35×27,5 en dos**, 35×39 | **35×34–39,5** | 107×52 | `opponentPanel.css:79-84` (`padding: 0.6em 0.45em` con margen negativo); pseudo solo en escritorio: `gameTable.css:4354-4365` | sí |
| Óvalo de VOZ-2 | el toque lo recibe el `.center-zone` entero (`GameTable.jsx:2000`, `onClick={toqueOvaloVoz2}`), de 96 a 140 px de alto | | | | | | el `<span role="button">` mide 117×34, pero es el destino del teclado, no del dedo | — |
| Burbuja de recarga | 155,5×40 | — | 155,5×40 | 155,5×40 | 155,5×40 | 155,5×40 | `rec.css` | no |
| Tarjeta **forzosa** («Recargar N», «**Salir con mis fichas**», montos) | **42** de alto (328×42 las dos acciones) | — | 42 | acciones 42, montos 38 | ídem | 42 | `apu.css:342-353` · `:433-451` · `:412-416` | no |
| Tarjeta forzosa: «Ver la mesa» | **36** | — | 36 | 38 | 38 | 38 | `apu.css:392-397` | no |
| Tarjeta **automática** (montos, «Recargar», «No recargar», «Ver la mesa») | **36** en todo | — | — | 36 (ver la mesa 38) | — | — | `apu.css:193-230` · `:392-397` | no |
| Filas del ⋮ abierto | 62×44 → 43,5, **una de 34,5** (la vecina le roba ~9,5) y otra de 52,5 | ídem | ídem | 43,5–44 | ídem | ídem | `menuMovil.css:195-266` | no |
| «Mano actual» del ⋮ (el rol `menuitem` va en el icono, U1b) | **19×26** | ídem | ídem | ídem | ídem | tapado | `menuMovil.css:266` | no |
| Contador de consultas del ⋮ | — | — | — | — | — | 40×44 (con ratón, 18×18) | `gameTable.css` B2 | sí |
| `.util-item-tapetes` (punto 12) | **solo se anota**: 63×35 y `u1` 0/8 (aplazado 2) | | | | | | | |
| Cartas del humano (descarte) | 58×89,5 | 64×99 | 68,5×106 | 100×141 | 63×89 | 116×163 | — | — |

**Distancias a los vecinos** (cajas visibles, 360×640):
- botón ↔ botón: 8 y 4;
- multiplicador ↔ botón de abajo: 2 en el borde (4 nominales: el hover pegado de B5 se come 2);
- multiplicador ↔ multiplicador: 5;
- ⋮ ↔ ✕: 8.

Con ratón (1920×937 fino) todo se queda en su caja visible (33, 28, 29). Es lo diseñado: B2 solo vive bajo `pointer: coarse`.

### B3 · El presupuesto vertical de 360×640

Turno del humano, el peor caso de D7: TURNO visible, cronómetro vivo y las pastillas MANO + TURNO en la barra. **Scroll 0 en las cuatro mesas.**

| Franja | Mesa 5 (y 4) | Mesa 2 |
|---|---|---|
| Relleno de la pantalla, arriba | 4 | 4 |
| Relleno de la mesa, arriba | 8 | 8 |
| Cabecera | 0 en flujo (absoluta: ⋮ y ✕ en 12..44) | 32 (14..46) |
| Rivales | filas 114 + 114 (`--o1-row-h` comprimido) | `.ai-zone` 181 (48..229) |
| Óvalo | **96** (274,81..370,81), centrado en su banda `1fr` | **140,5** (231..371,5) = `100svh − 573,5` |
| Hueco | 2 | 2 |
| Área del humano: relleno arriba | 5 | 5 |
| Cartas (`.cards-row`) | 93,83 (carta 56×87,83) | 93,83 |
| Hueco | 4 | 4 |
| **Área de acción** | **68,16** = `156 − --hcard-h`: multiplicadores **26** · hueco **4** · botones **28** · aire **10,16** (lo gasta el `+9` del `::after` de BT-1, que acaba a 1,66 del final del área) | ídem |
| Hueco de fila de la barra | 6 | 6 |
| Nombre y pastillas (`.player-bar-left`) | 64,39 (MANO en una fila; «Tú» + TURNO en otra) | 64,39 |
| Relleno del área, abajo | 7 | 7 |
| Relleno de la mesa y la pantalla, abajo | 10 + 4 | 10 + 4 |

**¿De dónde salen 12 px para los botones sin tocar los óvalos?** Del aire del propio área: 10,16 más 1,84 que se desbordan sobre el hueco de 6 de la barra. El área tiene alto fijo, así que el desborde no empuja nada (medido en B4: Δ 0, botón a 4,16 de la barra).

**¿Y para los multiplicadores (+14)?** No quedan. Los cinco sitios posibles:

| Fuente | Por qué no sirve |
|---|---|
| Banda del óvalo (mesas 5/4) | moverla mueve el óvalo, que va centrado: **D2** |
| Óvalo (mesas 3/2) | absorbe todo el sobrante (`100svh − estática`): tomar 1 px lo encoge 1 px. **D2** |
| La carta | carta + área = 156 constante: +14 al área son −14 de carta (56×87,8 → 47×73,8). Producto visible |
| La barra (64,39) | compactar MANO/TURNO a una fila daría ~29 px, pero es la reserva PT-1 de la barra: rediseño |
| Rellenos y huecos | ~6 px |

Los 14 de los multiplicadores solo salen por el camino (2).

En teléfonos comprimidos más anchos (≥370 px, carta en su techo de 58) el área baja a 65,02. Con botones de 40 el desborde sería 4,98 y quedaría **1 px** de la barra. Cabe, pero justo.

### B4 · Los dos caminos, probados en la copia

Los dos van como hoja aparte, sin tocar `gameTable.css`, y ganan por especificidad: `.game-table-screen …`, (0,4,0) contra (0,3,0).

**(1) Crecer el botón visible** (`exp1`):

```css
@media (max-width: 767px) and (orientation: portrait) and (max-height: 772px) {
  .game-table-screen .action-area .btn:not(.btn-mult) { min-height: 40px; }
  .game-table-screen .action-area .btn:not(.btn-mult)::after { top: 0; bottom: 0; }
  .game-table-screen .action-area.action-col { flex-wrap: nowrap; }
}
```

- **La trampa de la primera versión, sin `nowrap`:** el área es `.action-area.action-col`, una columna flex con `flex-wrap: wrap` (base `:449-457` + `:507-510`) y alto fijo. Con 26 + 4 + 40 = 70 > 68,16, **la columna se parte en dos**: multiplicadores y botones quedan en una fila que se sale por la derecha (captura `franjas_m5_360x640_exp1.png` de la primera tanda). Con `nowrap` el desborde de 1,84 cae en el hueco de la barra.
- **Medido, 360×640 en mesas 5 y 2:** botones 40 visibles = 40 efectivos (cuadro de 40 al 100 %).
- **Δ contra la base:** solo cambian `botones.h` y `.b` (28→40, 535,45→547,45). El área (68,16), la barra (551,61..616), las cartas, el óvalo, los multiplicadores y el scroll (0), **Δ 0**.
- **Lo que no arregla:** los multiplicadores siguen en 26, y la ✕, las fichas y los nombres no se tocan.

**(2) Agrandar solo la zona táctil** (`exp2`, afinado a `exp3` y `exp4`; abajo, `exp4` tal cual):

```css
@media (max-width: 767px) and (orientation: portrait) and (pointer: coarse) {
  .game-table-screen .player-bar .mult-row .btn-mult { position: relative; min-width: 35.5px; }
  .game-table-screen .player-bar .mult-row .btn-mult::after { content: ''; position: absolute; top: -14.5px; bottom: -1.5px; left: -3.5px; right: -3.5px; }
  .game-table-screen .header-right .btn-leave { position: relative; z-index: 3; }
  .game-table-screen .header-right .btn-leave::after { content: ''; position: absolute; top: -6.5px; bottom: -6.5px; left: -3.6px; right: -10px; }
  .game-table-screen .opp-corner-chip::after { content: ''; position: absolute; top: -15px; bottom: -6px; left: -6px; right: -6px; }
  .game-table-screen .opp-panel .opp-name.opp-name-tappable { position: relative; z-index: 6; overflow: visible; }  /* exp4: (0,4,0) */
  .game-table-screen .opp-panel .opp-name-tappable::after { content: ''; position: absolute; top: -3px; bottom: -3px; left: -4px; right: -4px; }
}
@media (hover: none) { .game-table-screen .action-area .btn:hover { transform: none; } }
```

**Multiplicadores.**
- Ancho visible 31,7 → 35 (+3,3; la fila se recentra: ×1 Δx −4,96, ×10 Δx +4,93). El ½ hueco de 5 cierra los 40.
- En vertical crecen 13,5 px **hacia arriba**: el aire con las cartas (8 px) y 5,5 px sobre el pie de las cartas, que en la apuesta están inertes. Hacia abajo, 0,5 dentro del hueco con el `::after` de BT-1.
- Medido, 360×640: 39,5×38–40. Los dos que caen sobre «Apostar» se quedan en 38 por el hover pegado; con la guarda `(hover: none)`, 40.
- 390×844: 39,5×40, y ×10 44×40.

**✕.**
- A la izquierda, la mitad del aire que deja el pseudo del ⋮ (2,65); a la derecha, el borde de la mesa.
- 360×640: 42,5×40 en mesa 5; 42,5×37,5 en mesa 2, donde `.ai-zone` la tapa. Por eso el `z-index: 3` de `exp3`.

**Fichas.**
- `exp2` (±6): 40×40 en la fila de abajo, pero **40×31,5 en la de arriba**. El panel siguiente pinta encima, y como `.opp-panel` es contexto de apilamiento (opacidad de `turn-dimmed`), el `z-index` de la ficha no lo saca.
- `exp3` lo compensa creciendo hacia arriba (−15), sobre el rótulo de estado del propio panel, que no es tocable.

**Δ contra la base (360×640, mesas 5 y 2):** solo cambian `x` y `w` de los multiplicadores. Área, barra, botones, cartas, óvalo, ✕ y fichas (visibles) y scroll, **Δ 0**.

**Conflictos de `z-index` revisados.**
- El pseudo de la ✕ queda bajo el panel del ⋮ (z 30), la capa de VOZ-2 (z 20) y los modales (100/120).
- El de los multiplicadores solo existe en la apuesta: el `.mult-row` no se monta en el descarte, que es cuando las cartas sí son tocables.

**¿Cabe fuera de `gameTable.css`?** **Sí, los dos caminos.** La casa natural es una hoja nueva importada en `GameTable.jsx` detrás de `rec.css` (`:75`), en el mismo chunk y después de `gameTable.css` (`:2`), como `luz`, `voz2`, `rev` y `rec`.

**Mi recomendación para la lámina:**
- el **(2)** para todo lo que no sean los tres botones de la fila;
- para los botones, enseñar los dos: el (1) da 40 visibles, sin coste medible en 360×640 y con 1 px de margen en los anchos de techo.

### B5 · El hover pegado (hallazgo de producto, fuera de alcance de la ficha)

- **La regla:** `.btn:hover { transform: translateY(-2px) }` (`gameTable.css:497`) no va bajo `@media (hover: hover)`.
- **En táctil**, el último botón tocado conserva `:hover`. Medido: el botón bajo el último clic queda con `matrix(1,0,0,1,0,-2)` y `:hover` a 0,3, 1,5 y 4 s (modo `hover`). Se queda 2 px arriba.
- **Cómo rompe el embaldosado al ½ hueco:**
  - en el horizontal, «Apostar» se queda en **37,5** porque «Pasar», levantado, le roba la franja;
  - en el vertical, «Apostar» les roba 2 px a ×1 y ×2.
- **Lo ve el arnés:** en los contextos `isMobile`, `page.mouse.move` **no suelta** el `:hover` que dejó el clic del CTA. Es un artefacto del instrumento, pero el comportamiento existe también en un teléfono.
- **Arreglo fuera del protegido:** `@media (hover: none) { .game-table-screen .action-area .btn:hover { transform: none } }`.

---

## §C · Los vigilantes

### C1 · `apu.6` «a propósito» (opción b)

**Hoy.** `diagDSK.mjs:2949-2966` mide `.action-buttons .btn, [data-accion="recarga-monto"]` donde la dejó `apu.5`, casi siempre en el pago, sin fila. Además compara la **caja visible** (`getBoundingClientRect().height`) contra 36. Si un día midiera la fila de 360×640, saldría rojo por 28 < 36 **aunque la zona táctil sea 40**. Es un vigilante ciego que, al abrir los ojos, miraría la cosa equivocada.

**Propuesta.** Escrita y probada **en la copia**:
- mesa nueva, mano 1: la Mano es el asiento 0, el humano, que abre él. Se espera a `.action-buttons .btn`;
- se miden la fila y los multiplicadores con `__hitBox`, el mismo barrido de `tactil`/`u1`;
- mesas 2 y 5, por D6;
- `ok` = sin desborde del documento, nada fuera de la vista y **cada tocable ≥ 40 por eje**;
- no reutiliza el estado de `apu.2`: allí la fila es la de All-in (`?apu=allinHumano`), sin multiplicadores;
- se separa del piso de la tarjeta de recarga: los montos y botones de la tarjeta se rigen por `APU-1_Reglas_v1.3:217` (36, y 40 en la forzosa), que es F5.

**Su mínimo: 40**, con INV-07, en vez de 36.

**Control en la copia (`apu 360x640`):**

| Corrida | Veredicto | `apu.6` (mesas 2 y 5, idénticas) | Resto de puntos |
|---|---|---|---|
| Producto de hoy | **ROJO, código 1**: «FALLA 360x640 · apu.6» | multiplicadores **×1 33×27 · ×2 33×27 · ×5 32×27 · ×10 40×27** bajo el piso; la fila pasa con 60×41, 89×41 y 79×41 | `apu.1`–`apu.5` y `apu.7` verdes |
| Con `exp3` (`VITE_CTL_PAN=1`) | **VERDE, código 0**, 1/1 celdas | multiplicadores 41×41, 40×41, 41×41 y 44×41; la fila igual | todos verdes |

El rojo de hoy es exactamente el incumplimiento real (los multiplicadores), no la caja de 28 de la fila. `__hitBox` cuenta píxeles inclusivos (+1 sobre el barrido de 0,5 de §B).

### C2 · `tactil`: por qué no vio los 28 px

**Las cuatro razones:**
1. **No visita teléfonos.** `TOUCH_VPS` (`diagDSK.mjs:3313`) son 1024×768, 1280×720, 1366×768 y 1920×1080, desde TAC-1. Las 16 celdas son escritorio táctil.
2. **Y si los visitara, la fila le saldría verde**, porque mide la zona táctil (`::after` incluido), que es 40. Los 28 son la caja visible. Lo que **sí** habría visto rojo en 360×640: los multiplicadores, las fichas y los nombres.
3. **No mide la ✕** (`.btn-leave` no está en sus selectores, `:3338-3373`). Por eso tampoco ve el 31×29 del escritorio táctil.
4. Sus selectores sí cubren los multiplicadores, así que el punto ciego es de celdas, no de selector.

**El arreglo mínimo**, escrito en la copia (unas 8 líneas):
- las cinco celdas de teléfono en `TOUCH_VPS` (360×640, 390×844, 412×915, 915×412, 640×360);
- filtro `tactil [celda] [mesa]`;
- `{ sel: '.btn-leave', name: 'salir' }` en la espera.

**Control en la copia (`tactil 360x640`, mesas 5/4/3/2):**

| Corrida | Veredicto | Lo que falla |
|---|---|---|
| Producto de hoy | **ROJO, código 1**, las cuatro mesas | multiplicadores 33×27 (×10 40×27); fichas 28–29×28; ✕ 31×30; nombres 35–36×39 (mesas 5/4/3) |
| Con `exp3` (`VITE_CTL_PAN=1`) | **ROJO, código 1**, solo en mesas 5/4/3; **mesa 2 verde** | multiplicadores, fichas y ✕ ya pasan. Quedan los nombres (36×33–40): el `::after` perdía la cascada (ver «Instrumento») |
| Con `exp4` (nombres a (0,4,0)) | **VERDE, código 0**, las cuatro mesas | nombres 43–44 × 42–46; nada por debajo de 40 |

**Coste para el resto de la matriz:** añadir la ✕ volverá rojas las 16 celdas de escritorio táctil (31×29 medido en `1920x937c`). Es verdad de producto, no ruido. Por eso el camino elegido tiene que cubrir también el escritorio táctil, o la ✕ entra en el vigilante con su alcance declarado (F6).

### C3 · La pantalla completa: ¿un vigilante barato que sepa fallar?

**Sí, una prueba unitaria del núcleo**, con el molde de la casa (`useCongelado.test.js`: sin jsdom; `document` y `window` falsos pasados por parámetro). Sus casos:
1. `entrar(doc, win)` llama a `requestFullscreen` **antes de devolver**. Un espía comprueba que la llamada es síncrona: si alguien la mete tras un `await`, sale rojo.
2. Sin API (`requestFullscreen` ausente o `fullscreenEnabled` falso): no hace nada y no lanza.
3. Instalada (`display-mode: standalone|fullscreen`, o `navigator.standalone`): no hace nada.
4. Ya en pantalla completa: no la pide otra vez.
5. La promesa rechazada se traga, sin `unhandledrejection`.
6. `salir(doc)`: llama a `exitFullscreen` solo si hay `fullscreenElement` **y la pidió la mesa**.
7. **No se reentra sola:** tras un `fullscreenchange` a «fuera», ningún oyente vuelve a pedirla.

Su control, en la Fase 1 y en una copia: mover la llamada detrás de un `await` o de un `setTimeout` → el caso 1 sale rojo; quitar la comprobación de instalada → el caso 3 sale rojo.

Lo que no puede vigilar Chromium sin cabeza (el alto no cambia) queda como **doctrina** y validación en el S25: el salto al entrar y el atrás de Android.

### C4 · Texto propuesto para `docs/AJILEI_Invariantes_v1.0.md` (Fase 1)

**INV-07**, columna Vigilante. Sustituir la frase del incumplimiento conocido por:

> `diagDSK tactil` (desde PAN-1: celdas de teléfono 360×640, 390×844, 412×915, 915×412 y 640×360, y la ✕) · `diagDSK apu` (apu.6: la fila y los multiplicadores en el turno del humano, mesas 2 y 5, zona táctil ≥ 40) · `diagDSK u1` · `diagDSK u2` · `diagDSK menu-movil` · `diagSAL sal` (p4) · `diagDSK lob` · `diagDSK retar`. La zona táctil se mide por barrido con `elementFromPoint`, no por la caja visible

**INV-07**, estado: «vigilado» si el camino elegido cubre todas las celdas; si no, «vigilado (parcial)», con su hueco nombrado.

**Fila nueva (INV-45, si el rector la quiere):**

> La pantalla completa se pide solo dentro del gesto de «Retar», no hace nada sin API o instalada, se suelta al dejar la mesa y no se reentra sola

- Fuente: `AJILEI_PAN-1_…` (la ficha de Fase 1).
- Vigilante: `src/lib/pantallaCompletaCore.test.js` (nombre provisional).
- Estado: vigilado, con el salto de entrada y el atrás de Android como doctrina.

Regla de ARN-1 aplicada: quien mueve la ruta recablea el metro. `apu.6` y `tactil` cambian en el mismo commit de arnés que su fila.

---

## §D · Aplazados del cierre de ARN-3 en este terreno

- **`.btn-soon` y `.soon-tag`** (`gameTable.css:783` y `:798`). Un `grep` en `src/` y `scripts/` (`.js`, `.jsx`, `.css`, `.mjs`) da **ningún consumidor**: solo sus definiciones y una mención en un comentario de `celebracion.css:185`. Como esta campaña **no necesita abrir** `gameTable.css` (§E2), **se quedan** (aplazado 6).
- **H3e-i-3, el fallo de carga de vitest:** **no apareció**. En esta Fase 0 no se corrió vitest: no hacía falta para medir.
- **Otros aplazados que tocan la fila o la altura de la mesa:**
  - **21 (H3e-ii-1)**: es esta campaña. Con la corrección de §0.1: la fila cumple por zona táctil; lo que incumple son los multiplicadores, la ✕, las fichas, los nombres y dos filas del ⋮.
  - **2 (`u1` hits 0/8, `.util-item-tapetes`)**: solo anotado, punto 12.
  - **17 (el origen de la reposición del descarte, 23–29 px sobre el tapete)**: no toca la fila; vive en el área del humano. Sin cambios.
  - **20 (pendientes de iOS)**: suma las marcas de abajo.
- **Deudas declaradas en comentarios del protegido** que esta campaña cerraría sin abrirlo:
  - «los mults […] su táctil es deuda aparte» (`gameTable.css:1936-1937`);
  - «Táctil V resultante ≈23» de MT-1 en el horizontal (`:3270-3272`).

  El camino (2) cubre la primera. La segunda (horizontal, 22,5) queda **fuera** de `exp3`, que solo es vertical. Va como pregunta F7.

**iPhone, pendiente (D8):**
- que la API no existe en Safari y la función no hace nada;
- que la PWA instalada se abre sin barras;
- el piso táctil en el iPhone;
- el `:hover` pegado en iOS.

---

## §E · El plan de la Fase 1

### E1 · Sub-tandas, en orden

| Sub-tanda | Qué | Para quién |
|---|---|---|
| **1a · Lámina de B** | 360×640 y S25 (360×680 en pestaña) en mesas 5 y 2. Tres variantes: hoy · (2) · (1) + (2). Recortes de la fila, la ✕ y las fichas, con la zona táctil pintada encima | Victor elige el camino |
| **1b · B con sus vigilantes** | La hoja nueva (`src/styles/tactil.css`, nombre provisional), importada en `GameTable.jsx` tras `rec.css`. La guarda `(hover: none)`. `tactil` con las celdas de teléfono y la ✕. `apu.6` a propósito. Si el rector lo pide, el horizontal de MT-1 y el escritorio táctil de la ✕. Control rojo → verde de los dos vigilantes | — |
| **1c · La pantalla completa** | `src/lib/pantallaCompletaCore.js` + su prueba; dos llamadas en `App.jsx` (`onRetar` y `onLeave`). Validación en el S25: entrada, salto al entrar, atrás, bloqueo y fin de partida | Victor, en el teléfono |
| **1d · Doctrina** | INV-07 y, si se aprueba, INV-45 | — |

### E2 · ¿Se abre `gameTable.css`?

**No.** Ninguno de los dos caminos lo necesita:
- los dos ganan por especificidad (0,4,0 frente a 0,3,0) desde una hoja propia;
- la guarda del hover gana con (0,4,0) frente a `.btn:hover` (0,2,0).

**Lo que quedaría desfasado dentro del protegido son comentarios**, sin cambiar ningún comportamiento:
- `gameTable.css:2043-2053` dice «aquí no hay presupuesto para 40 reales»: con el camino (1) los habría;
- `:1936-1937`, la deuda de los multiplicadores.

Si un día se abre por otra causa, que viajen con `.btn-soon`/`.soon-tag` (aplazado 6).

### E3 · Mapa provisional archivo → commit

1. **Núcleo:** `src/lib/pantallaCompletaCore.js` + `pantallaCompletaCore.test.js`.
2. **Arnés:** `scripts/diagDSK.mjs` (`tactil`: celdas, filtro, ✕; `apu.6` a propósito) y, si aplica, `scripts/arnes/nucleo.mjs` (sin cambio previsto: `tactil` ya es `BOOLEANOS(['allInteractiveOk', 'multNoOverlap'])`).
3. **Pantallas:** `src/styles/tactil.css` (nueva) · `src/components/GameTable.jsx` (un `import`) · `src/App.jsx` (las dos llamadas).
4. **Doctrina:** `docs/AJILEI_Invariantes_v1.0.md` (INV-07, INV-45) y, si el rector lo pide, una nota en `AJILEI_Sistema_Diseno_v1.2.md` **después** de la línea 433.
5. **Informes.**

### E4 · Estimación

| Pieza | Claude Code | No se comprime |
|---|---|---|
| 1a · lámina (capturas con la zona pintada, 3 variantes × 2 mesas × 2 celdas) | ~35 min | **la elección de Victor** |
| 1b · CSS (afinar nombres y ✕ en las 5 celdas de teléfono + escritorio táctil) + vigilantes + controles | ~90 min (de ellos ~30 de corridas: `apu 360x640` tarda unos 5 min; `tactil` entero, con 36 celdas, unos 35) | — |
| 1c · núcleo + prueba + dos llamadas + Δ en las celdas | ~45 min | **la validación en el S25** (entrada, salto, atrás, bloqueo, fin de partida): de 15 a 20 min de Victor |
| 1d · doctrina + informes | ~30 min | revisión del rector |
| **Total Claude Code** | **~3 h 20 min** | |

---

## §F · Preguntas al rector

1. **La regla de la salida** (§A3). Propuesta: se entra al tocar «Retar»; se sale en `onLeave` (✕, victoria, derrota, «Salir con mis fichas»); no se reentra sola tras atrás, Esc o un bloqueo. ¿Se acepta, o se quiere reentrar con el siguiente toque dentro de la mesa?
2. **INV-04 frente a la pantalla completa** (§A4). Entrar o salir cambia la geometría del óvalo:
   - crece +80/+100 en mesas 3/2 y baja +40/+50 en mesas 5/4;
   - en el S25 cruza el corte de 772 y cambia la mesa entera (carta, botones, cabecera);
   - en 1440×900 cruza el de 900 (óvalo −70,41 de ancho).

   Todo vuelve exacto al salir. ¿Cuenta como «movimiento» bajo INV-04 o es de la familia del giro del teléfono? Si cuenta, las salidas posibles son:
   - (a) congelar la geometría al alto de entrada mientras dure la mesa (pide JS: hoy todo es CSS);
   - (b) entrar en pantalla completa antes de que la mesa monte, al tocar «Jugar» en el lobby;
   - (c) aceptarlo.
3. **La orientación** (§A5). ¿`screen.orientation.lock()` en Android al entrar? No lo propongo por defecto.
4. **Escritorio** (§A6). ¿Se ofrece la pantalla completa en escritorio? Gana unos 140 px de alto, y en 1440×900 cambia el escalón de cartas en plena mano.
5. **El mínimo de `apu.6` y la tarjeta de recarga** (§C1). Propuesta: **40** para la fila y los multiplicadores. Y la tarjeta: `APU-1_Reglas_v1.3:217` pide 36 (40 en la forzosa), y la automática mide 36 en todo. ¿Sube a 40 con INV-07 (otro frente: `apu.css`) o se queda en 36 como excepción escrita?
6. **El alcance de la ✕ en `tactil`** (§C2). Si entra en el vigilante, el escritorio táctil sale rojo hasta arreglarla allí también. ¿Entra el escritorio táctil en PAN-1 o se declara el hueco?
7. **El horizontal** (§D). Los multiplicadores del horizontal (MT-1) miden 22,5 de alto y su comentario lo declara. ¿Entran en PAN-1?
8. **El `:hover` pegado** (§B5). ¿Viaja en 1b, aunque es de todos los botones `.btn` de la mesa y no solo del piso táctil?
9. **Las filas del ⋮** (34,5 de una fila y el rol en el icono de «Mano actual», 19×26). Son de `menuMovil.css`, no protegido. ¿Entran en PAN-1 o en la campaña dueña del ⋮ (aplazado 2)?

---

## Hallazgos

| # | Hallazgo |
|---|---|
| H-PAN0-1 | **El aplazado 21 medía la caja visible.** La fila de 360×640 tiene una zona táctil de 40 gracias a BT-1 (`gameTable.css:2054-2062`). Lo que incumple INV-07 en vertical: multiplicadores (24,5–26), ✕ (29), fichas (28/25,5), nombres del pago (≈35×39, uno 34) y dos filas del ⋮ |
| H-PAN0-2 | **«Salir con mis fichas» mide 42**, no 28, en las 5 celdas. La cifra de 28 venía de REC-1 Fase 0 (25-sep), anterior a A5. La tarjeta automática mide 36 en todo: cumple su norma de APU-1 (36), no INV-07 |
| H-PAN0-3 | **`tactil` no visita teléfonos** (`TOUCH_VPS`, `:3313`) **y no mide la ✕**. La ✕ mide 31×29 también en escritorio táctil |
| H-PAN0-4 | **El área de acción es una columna con `flex-wrap: wrap` y alto fijo:** 1,84 px de más la parten en dos columnas y la fila se sale de la pantalla. Cualquier crecimiento vertical dentro del área necesita `nowrap` |
| H-PAN0-5 | **`.btn:hover` pegado en táctil** (`gameTable.css:497`): −2 px que rompen el embaldosado al ½ hueco (37,5 en el horizontal, 38 en dos multiplicadores) |
| H-PAN0-6 | **La pantalla completa cambia el óvalo** (mesas 3/2 crece, 5/4 baja) y, en el S25 (360×680→780) y en 1440×789→900, **cruza un corte de media query en plena mano**. Todo vuelve exacto al salir |
| H-PAN0-7 | **Chromium sin cabeza entra en pantalla completa sin cambiar el alto**, y `page.evaluate` cuenta como gesto: el arnés no puede medir el salto real de entrada ni probar «sin gesto». La ventana de activación sí se mide (300 ms entra, 6 s `TypeError`) |
| H-PAN0-8 | **En contextos `isMobile`, `page.mouse.move` no suelta el `:hover`** que dejó el último clic. Cualquier vara táctil del arnés ve el botón bajo el CTA de Retar 2 px arriba |
| H-PAN0-9 | **La primera corrida de la copia (`fs`, 09:39) reescribió `node_modules/.vite/deps` del repo** a través de la unión. Es caché regenerable. Desde entonces la copia usa `cacheDir: '.vite-copia'`. El `.vite-temp` de la configuración lo sigue escribiendo Vite junto a `node_modules` (sospechoso de H3e-i-3) |

## Instrumento y trampas de esta Fase 0

- **Mi `cp` posterior pisó los JSON de la primera tanda de experimentos** (la sonda ya los escribía con su etiqueta). Se repitió la tanda. Las cifras de B4 son de la segunda.
- **`python -` con heredoc se cuelga en Git Bash** (estaba en la memoria). Se perdió una tarea de fondo, parada con `TaskStop`. Las ediciones de la copia se hicieron con `node -e`.
- **`pan-exp.css` importado desde `main.jsx` entra antes que el chunk de la mesa:** a igual especificidad ganan `gameTable.css` y `opponentPanel.css`.
  - Lo pagó el `::after` de los nombres en `exp3`: `.table-five .opp-header .opp-name { overflow: hidden }` (`opponentPanel.css:662-670`, (0,3,0)) empataba con mi selector y recortaba el pseudo a la caja del propio nombre. Medido sin cambio: 36×39.
  - `exp4` sube a (0,4,0).
  - En la Fase 1 la hoja va en `GameTable.jsx`, detrás de las de la mesa, y el problema desaparece. Aun así, cada regla debe ganar por especificidad y no por orden, que es el criterio de la casa.
  - Ojo: `overflow: visible` en el nombre anula su `ellipsis` mientras dure el pago, igual que hace hoy el escritorio (`gameTable.css:4365`). Con «IA n» no se nota; con nombres de PvP largos, sí.
- Duración de las corridas:
  - `tocables` (14 celdas × mesa): 16 min;
  - `alto` (28 páginas): 10 min;
  - `recarga`: 6 min;
  - `tactil 360x640` (4 mesas): 4 min;
  - `apu 360x640`: unos 5 min solo y unos 8 en paralelo con otra.

## STOP

Comprobado a las 10:09:

- **Puertos 4170–5599:** solo `0.0.0.0:5040`, PID 7724 (el `svchost` de siempre). Los servidores de la copia (5173 y 5175–5179) vivían dentro de los procesos de las sondas y murieron con ellos.
- **`node` vivos:** ninguno (`Get-CimInstance Win32_Process`: 0).
- **La copia:** la unión a `node_modules` se quitó con `[System.IO.Directory]::Delete(…, $false)` **antes** de intentar el borrado (la comprobación devuelve `False`). El borrado de la carpeta está **denegado** por el modo auto, así que **la copia se queda en el scratchpad sin unión**. Lleva dentro, solo en ella, los parches de los vigilantes (`scripts/diagDSK.mjs`), `src/styles/pan-exp.css`, la línea de `main.jsx` y el `cacheDir` de `vite.config.js`.
- **`node_modules` del repo:** intacto (154 entradas; `vite`, `playwright-core` y `react` presentes). La única escritura fue la de caché de H-PAN0-9.
- **`git status`:** los 5 residuos (2 informes de MOT-1 y los 3 de `laminas/mon1/`) y este informe. HEAD sigue en `3d1b19e`. Sin `git add`.
- **Ninguna sonda efímera en el repo.** `sondaPAN.mjs`, `exp1`–`exp4.css`, `apu6.txt` y las salidas (`out/`: JSON, logs y capturas `franjas_*`, `apuesta_*`, `recarga_*`) están en el scratchpad de la sesión.

**Parada aquí, en espera de la revisión del rector y de la lámina (1a).**

---

## Decisiones del rector (revisión del STOP) y lámina 1a

- **Fecha:** 2026-10-04, de 11:46 a 12:10 (24 min de un tope de 50).
- **Ficha:** `AJILEI_PAN-1_1a_Lamina_v1.0.md`. Base `3d1b19e`.
- **Lámina:** `laminas/pan1/lamina.html`, con 114 capturas JPEG en `laminas/pan1/img/` (13 MB, sin rastrear). Se abre sola con doble clic. Tiene un botón para alternar entre las capturas limpias y las de zona pintada.

### Las decisiones (§0 de la ficha, tal cual)

| # | Pregunta | Decisión |
|---|---|---|
| D1 | Corrección del aplazado 21 (H-PAN0-1) | **Aceptada.** La fila de acciones ya cumple por zona táctil. Lo que incumple, y es el alcance de B: los multiplicadores, la ✕, las fichas de las IAs, los nombres tocables del pago y las filas del ⋮. |
| D2 | **F5**, la tarjeta de recarga | **Una sola norma: 40** (INV-07). La tarjeta automática y «Ver la mesa» pasan de 36 a 40, y `APU-1_Reglas_v1.3:217` se actualizará en la 1d. En la lámina se muestra la tarjeta a 36 y a 40. |
| D3 | **F6**, la ✕ en escritorio táctil | **Entra en PAN-1.** Mismo patrón, coste pequeño, y así no queda un rojo de producto abierto. `tactil` mide la ✕ en todas sus celdas. |
| D4 | **F7**, los multiplicadores del horizontal (22,5, MT-1) | **Entran en PAN-1.** Mismo patrón de zona táctil. Se cierra la deuda declarada en `gameTable.css:3270-3272` sin abrir el protegido. |
| D5 | **F8**, el `:hover` pegado | **Viaja en la 1b**, para todos los `.btn` de la mesa, con `@media (hover: none)`. Rompe el embaldosado y además es un fallo visible. |
| D6 | **F9**, las filas del ⋮ | **Entran en PAN-1** (la fila de 34,5 y «Mano actual», con el rol en el icono, de 19×26). Así INV-07 queda vigilado sin hueco. `.util-item-tapetes` sigue siendo del punto 12. |
| D7 | Los nombres tocables | **La elipsis no se sacrifica.** Con nombres de PvP de hasta 12 caracteres, `overflow: visible` en el propio nombre (la solución de `exp4`) los desbordaría. Busca una variante que conserve la elipsis: el pseudo en un contenedor del nombre, un elemento propio, o la que mida mejor. Si ninguna llega a 40 sin perder la elipsis, es pregunta. |
| D8 | Especificidad | Cada regla gana **por especificidad**, nunca por orden de carga. La hoja final irá en `GameTable.jsx`, detrás de `rec.css`. |
| D9 | La caché de la copia (H-PAN0-9) | La copia lleva su `cacheDir` propio **desde el primer arranque**, antes de cualquier corrida. El `node_modules/.vite` del repo no se escribe nunca. |

### Cómo se midió

- **Copia nueva** (`git ls-files -co`, más `.env.local`), con `cacheDir: '.vite-copia'` escrito antes del primer arranque (D9).
- **Un cambio de método contra H-PAN0-9:** la copia **no lleva una unión a `node_modules`**. Lleva un `node_modules` propio con **una unión por paquete** (151), sin `.vite` ni `.vite-temp`. Así lo que Vite escribe junto a `node_modules` cae dentro de la copia, incluido el `.vite-temp` de la configuración (el sospechoso de H3e-i-3). Comprobado al cerrar: el `.vite-temp` está en la copia, y el `.vite` y el `.vite-temp` del repo son **idénticos** a su foto de las 11:46 (23 entradas, fechas y tamaños).
- **Capturas:**
  - app real, servidor de desarrollo de la copia dentro del proceso, Chromium 151 del arnés, DPR 2;
  - `hasTouch`, y `isMobile` en las celdas de teléfono;
  - aislamiento D6 verde.
- **Zona táctil:** el `__hitBox` de `tactil`/`u1` copiado tal cual, un barrido en cruz de 1 px con `elementFromPoint`.
- **D8 en la forma fuerte:** el CSS candidato entra como **primera** hoja del `<head>`, y todo el CSS del proyecto carga detrás. Solo puede ganar por especificidad. Comprobado en las 26 páginas de escenas (`cssPrimero: true`).
- **Escenas:**
  - turno del humano (TURNO y cronómetro vivos);
  - pago (+4,3 s);
  - ⋮ abierto;
  - tarjeta automática (`?apu=saldo:5000,recarga`) y forzosa (`?apu=saldo:5000,allinHumano`), en mesa 2.

### El CSS final

**Z · camino 2:**

```css
/* ═══ PAN-1 · Z · camino 2: sólo zona táctil (embaldosado B2) ═══════════════════
   Cada regla gana por ESPECIFICIDAD (D8): la lámina la inyecta como PRIMERA hoja
   del <head>, detrás de la cual carga todo el CSS del proyecto. */

/* D5 · el :hover pegado de los .btn de la mesa (gameTable.css:497) no levanta en táctil */
@media (hover: none) {
  .game-table-screen .btn:hover { transform: none; }                                    /* (0,3,0) > (0,2,0) */
}

/* ── Vertical (teléfono) ── */
@media (max-width: 767px) and (orientation: portrait) and (pointer: coarse) {
  /* Multiplicadores: ancho visible 31,7 → 35,5; zona −13,5 arriba (aire con las cartas,
     inertes en la apuesta) y +0,5 abajo (hasta el pseudo de BT-1). Ancla: padding-box (borde 1). */
  .game-table-screen .player-bar .mult-row .btn-mult { position: relative; min-width: 35.5px; }
  .game-table-screen .player-bar .mult-row .btn-mult::after {
    content: ''; position: absolute; top: -14.5px; bottom: -1.5px; left: -3.5px; right: -3.5px;
  }
  /* ✕: a la izquierda, la mitad del aire que deja el pseudo del ⋮; a la derecha, el borde. */
  .game-table-screen .header-right .btn-leave { position: relative; z-index: 3; }
  .game-table-screen .header-right .btn-leave::after {
    content: ''; position: absolute; top: -6.5px; bottom: -6.5px; left: -3.6px; right: -10px;
  }
}

/* ── Horizontal (teléfono) · D4: multiplicadores de MT-1 (gameTable.css:3270-3272) ── */
@media (orientation: landscape) and (max-height: 600px) and (pointer: coarse) {
  /* Arriba los toca el pseudo de «Retirarse» (½ hueco, BT-L): sólo crecen HACIA ABAJO,
     sobre el fondo de la mesa (24 px libres en 640×360, 35 en 915×412). */
  .game-table-screen .player-bar .mult-row .btn-mult::after { bottom: -18px; }        /* (0,4,1) > (0,3,1) */
  /* el ×10 anclaba su pseudo al borde (right: −1, :3301-3303) y se quedaba en 35 de ancho: el
     carril acaba a 5 px del borde de la mesa, sin nada tocable */
  .game-table-screen .player-bar .mult-row .btn-mult:last-child::after { right: -6px; }
  /* ✕ de mesa 2 (32×28): ½ del aire con el ⋮ a la izquierda; resto a la derecha y en vertical. */
  .game-table-screen .table-two .header-right .btn-leave { position: relative; z-index: 3; }
  .game-table-screen .table-two .header-right .btn-leave::after {
    content: ''; position: absolute; top: -7px; bottom: -7px; left: -4px; right: -7px;
  }
  /* ✕ de mesas 5/4 (absoluta, 15×19 → hoy 24×45): sólo puede crecer A LA IZQUIERDA, sobre la
     esquina del panel de IA 1. Cruza el «NUNCA a la izquierda» de gameTable.css:3363 → lámina. */
  .game-table-screen .table-five .header-right .btn-leave::after,
  .game-table-screen .table-four .header-right .btn-leave::after { left: -17px; }
}

/* ── Teléfono, las dos orientaciones: fichas y nombres ── */
@media (max-width: 767px) and (orientation: portrait) and (pointer: coarse),
       (orientation: landscape) and (max-height: 600px) and (pointer: coarse) {
  /* Ficha de la IA (28×28, opponentPanel.css:505-517): crece más hacia ARRIBA, porque el panel
     siguiente (contexto de apilamiento propio) le pinta encima por abajo. */
  .game-table-screen .opp-panel .opp-corner-chip::after,
  .game-table-screen .ai-zone .opp-corner-chip::after {
    content: ''; position: absolute; top: -15px; bottom: -6px; left: -6px; right: -6px;
  }
  /* D7 · Nombre tocable: SIN tocar su overflow (la elipsis manda). Se agranda el MISMO
     mecanismo que ya usa (opponentPanel.css:79-84): padding transparente con margen negativo
     igual → caja externa intacta. 0.6em/0.45em (7,8/5,85 a 13 px) → 8.5px/9px: 23,2 + 17 = 40,2. */
  .game-table-screen .opp-panel .opp-name.opp-name-tappable {
    padding: 8.5px 9px; margin: -8.5px -9px; position: relative; z-index: 6;
  }
}

/* ── Escritorio táctil · D3: la ✕ ── */
@media (orientation: landscape) and (min-height: 601px) and (pointer: coarse) {
  .game-table-screen .header-right .btn-leave { position: relative; }
  .game-table-screen .header-right .btn-leave::after {
    content: ''; position: absolute; top: -7px; bottom: -7px; left: -4px; right: -8px;
  }
}

/* ── El ⋮ abierto · D6: «Mano actual» tiene el rol en el icono (19×26). El pseudo del icono
   cubre la fila entera (.util-item es position: relative): el toque en cualquier punto de la
   fila es del icono. El contador, hermano posterior, sigue encima. ── */
@media (pointer: coarse) {
  .game-table-screen .utilities-panel .util-item-mano button.util-ico-slot::after {
    content: ''; position: absolute; inset: 0;
  }
}

/* ── D2 · La tarjeta de recarga: una sola norma, 40 ── */
.game-table-screen .bankrupt-overlay .bankrupt-modal .btn[data-accion^="recarga-"] { min-height: 40px; }   /* (0,5,0) */
```

**V · caminos 1 + 2:** Z más este bloque.

```css
/* ═══ V · además, camino 1: la fila de acciones a 40 VISIBLES en el vertical comprimido ═══ */
@media (max-width: 767px) and (orientation: portrait) and (max-height: 772px) {
  .game-table-screen .action-area .btn:not(.btn-mult) { min-height: 40px; }            /* (0,4,0) > (0,3,0) de :2054 */
  .game-table-screen .action-area .btn:not(.btn-mult)::after { top: 0; bottom: 0; }    /* el pseudo de BT-1 ya no hace falta */
  /* el área es columna con wrap y alto fijo (H-PAN0-4): sin esto 70 > 68,16 la parte en dos */
  .game-table-screen .action-area.action-col { flex-wrap: nowrap; }
}
```

Tres cambios respecto a `exp4` de la Fase 0:
- **El nombre (D7) ya no toca `overflow`.** Agranda el mismo mecanismo que ya usa (`opponentPanel.css:79-84`): relleno transparente con margen negativo igual, de 0.6em/0.45em a 8,5 px/9 px. La caja externa no cambia, y la elipsis sigue mandando dentro.
- **El horizontal y el escritorio táctil entran** (D3, D4).
- **«Mano actual» extiende el pseudo del icono a toda la fila** (la fila `.util-item` ya es `position: relative`), y la tarjeta sube a 40 (D2).

### Las medidas de la lámina

Peor zona táctil por grupo, ancho × alto en px. «tap» = el centro lo tapa otro elemento. En negrita, lo que queda por debajo de 40.

| Celda · mesa | Variante | Fila | Multiplicadores | ✕ | Fichas | Nombres (pago) | «Mano actual» |
|---|---|---|---|---|---|---|---|
| 360×640 · m5 | H | 60×41 | **33×27** | **31×30** | **29×26** (+2 tap) | **36×39** | **19×27** |
| | Z | 60×41 | 40×41 | 43×40 | 41×49 (+2 tap) | 42×40 | 63×43 |
| | V | 60×41 (**visible 40**) | 40×41 | 43×40 | 41×49 | 43×41 | 63×43 |
| 360×640 · m2 | H | 60×41 | **33×25** | **31×30** | **28×28** | — | **19×27** |
| | Z / V | 60×41 | 40×41 | 43×40 | 40×49 | — | 63×43 |
| 360×680 · m5 | H | 60×41 | **33×25** | **31×30** | **29×26** | **36×39** | **19×27** |
| | Z / V | 60×41 | 40×41 | 43×40 | 41×49 (Z: +1 tap) | 42×40 | 63×43 |
| 360×680 · m2 | H → Z / V | 60×41 | **33×25** → 40×41 | **31×30** → 43×40 | **28×28** → 40×49 | — | **19×27** → 63×43 |
| 640×360 · m5 | H | **150×38** (hover pegado) | **40×23** | **24×45** | **29×28** (+2 tap) | 35×40 (**36×35** en uno) | **20×27** |
| | Z / V | 150×40 | 40×40 | 40×45 | 41×43 (+2 tap) | 43×42 (**42×36** en uno) | 62×43 |
| 640×360 · m2 | H → Z / V | **150×38** → 150×40 | **40×23** → 40×40 | **32×28** → 41×40 | **28×29** → 40×50 | — | **20×27** → 62×43 |
| 1920×937 táctil · m5 y m2 | H → Z | — | — | **31×29** → 41×41 | — | — | — |

**La elipsis (D7)**, con «Nombrelargo_PvP» inyectado en el pago:

| Celda | Variante | `overflow` | `text-overflow` | ¿Recorta? | Zona |
|---|---|---|---|---|---|
| 360×640 | Z | `hidden` | `ellipsis` | sí | 99×40 |
| 360×640 | V | `hidden` | `ellipsis` | sí | 99×42 |
| 640×360 | Z / V | `hidden` | `ellipsis` | sí | 91×42 |
| todas | H | `hidden` | `ellipsis` | sí | 84–93 × 36–40 |

**La tarjeta de recarga (D2), en mesa 2:**

| Celda | Tarjeta | H (hoy) | Z / V | Caja H → Z | ¿Cabe? |
|---|---|---|---|---|---|
| 360×640 | automática | montos, «Recargar», «No recargar» y «Ver la mesa»: **36** | **40** todos | 471..634 → 459..634 (+12 arriba) | sí |
| 360×640 | forzosa | montos y acciones 43; «Ver la mesa» **37** | 41 todos | 152,59..487,39 → 153,59..486,39 | sí |
| 640×360 | automática | **36**, «Ver la mesa» **38** | **40** todos | 147,22..348 → 137,22..348 | sí |
| 640×360 | forzosa | montos **39**, acciones 43, «Ver la mesa» **39** | 41 todos | 68,75..291,23 → 67,75..292,23 | sí |

**Δ del resto de anclas contra H** (óvalos, paneles, `.ai-zone`, cartas, barra, área, cabecera, mesa, zona del humano y scroll):
- **turno del humano: 0 en las 14 comparaciones** (Z y V, todas las celdas y mesas). En V solo cambian los tres botones de la fila (28 → 40 de alto);
- **pago y ⋮:** dos Δ de contenido, no de variante:
  - `barraDer` ±10,19 de ancho: la cifra del saldo, que depende de cómo acabó la mano en cada corrida;
  - en horizontal, dos paneles ±0,38/±0,75: qué panel se revela.

  Aparecen con signos cambiados entre corridas y en Z y en V por igual; en el turno, con la misma CSS, no aparecen. El método (corridas separadas) no permite probarlo más fuerte que eso;
- **la tarjeta:** las anclas de la mesa, sin cambio. La propia tarjeta crece 10–12 px y cabe en las dos celdas;
- **scroll:** 0 en todas las escenas.

**El techo de V** (mesa 5, turno; vertical comprimido):

| Ancho | Área | Desborde del área | **Margen a la barra** | ¿Fila partida? | Scroll V | Scroll H (hoy) |
|---|---|---|---|---|---|---|
| 360 (640 y 740 de alto) | 68,16 | 1,84 | **4,16** | no | 0 | 0 |
| 370 · 380 · 390 · 412 · 430 (a 740 de alto) | 65,02 | 4,98 | **1,02** | no | 0 | 0 |
| 370 · 380 · 390 · 412 · 430 (a 640 de alto) | 65,02 | 4,98 | **1,02** | no | **7 · 15 · 23 · 41 · 55** | **7 · 15 · 23 · 41 · 55** |

- **V cabe en todos los anchos**: la fila no se parte gracias al `nowrap`, y no toca la barra.
- **En los anchos de techo queda a 1,02 px de ella.** Cabe, pero sin aire; la lámina lo marca en rojo como aviso.
- **El scroll de 640 de alto en los anchos ≥ 370 es idéntico en H**: es preexistente (mesa 5 a 640 en teléfonos anchos) y no lo trae V.

### Lo que no salió limpio

1. **D6 tiene una contradicción.** La «fila de 34,5» del ⋮ **es Tapetes**: la sonda lo identifica por `data-entrada` (`[tapetes]`, 63×35 en vertical; en horizontal mide 43,5). La D6 la mete en PAN-1 y en la misma celda deja `.util-item-tapetes` en el punto 12.
   - En la lámina **no se toca**: sale en rojo en las tres variantes.
   - **Pregunta: ¿entra Tapetes en PAN-1 o sigue en el punto 12?**
   - «Mano actual» sí queda resuelta: 19×27 → 63×43.
2. **En el pago, las cartas reveladas del panel ganador tapan a veces la ficha y el nombre del panel vecino.**
   - La causa: el panel `opp-winner` (z 7, con su `.opp-cards` en z 6 y sus `IMG`) se pinta encima. La sonda `tapa` lo encuentra en 640×360 (ficha de IA 1 → `opp-cards · z 6 · panel … opp-winner`; nombre de IA 1 → `opp-card-slot · z 5`) y en 360×640.
   - Es **preexistente** (H igual: «+2 tap» y nombres de 35–38) y depende de quién gane.
   - No se arregla desde la ficha ni desde el nombre: el vecino es su propio contexto de apilamiento, por debajo del ganador.
   - En horizontal deja un nombre en 42×36 en Z y en V.
   - **Pregunta para la 1b:** o se acepta que durante la revelación el ganador manda sobre sus vecinos, o hay que tocar el apilamiento de la revelación (R1). Eso es `gameTable.css`/`opponentPanel.css`, protegidos.
3. **El nombre agrandado le pisa 2 px a la ficha del panel de arriba.** En vertical, el nombre del panel de abajo (relleno 8,5 + z 6) le quita los 2 px del pie a la ficha del panel superior. La sonda `tapa`, en 360×640, ve el pie de la ficha de IA 3 → `opp-name-tappable · z 6`. La ficha sigue en 41×49, porque su zona crece hacia arriba, así que no baja de 40. Pero es un solape de zonas: se anota.
4. **La ✕ de mesa 5 en horizontal cruza un comentario del protegido.** Solo puede crecer hacia la izquierda (24 → 40 de ancho), sobre la esquina del panel de IA 1. `gameTable.css:3363` dice «NUNCA a la izquierda (left:0) para no volver a pisar el panel». Esa esquina no tiene nada tocable (el nombre está a la izquierda del panel, la ficha abajo), y el pseudo es transparente. **Lo decide Victor en la lámina.** La regla de mesa 4 horizontal (la misma ✕ absoluta) va en el CSS **sin medir**: la lámina solo cubre las mesas 5 y 2.
5. **V a 1,02 px de la barra en los anchos de techo.** Cabe, pero sin aire (ver la tabla del techo).
6. **No cubierto, por ser celdas fuera de la ficha:**
   - 915×412 (S25 en horizontal);
   - 390×844 y 412×915 en vertical holgado: allí la fila ya mide 40 visibles y Z solo añade multiplicadores, ✕, fichas y nombres, ya medidos en la Fase 0 con `exp2`;
   - las mesas 4 y 3.

   Van en el control de `tactil` de la 1b, que ya recorre las cinco celdas de teléfono.
7. **El método del Δ es de dos corridas, no de un cambio en caliente.** Las escenas de pago y ⋮ comparan manos distintas (las cifras de contenido del punto anterior). El turno, que es determinista hasta ahí, sale con Δ 0.

### STOP de la 1a

Comprobado a las 12:03–12:06:
- **Puertos 4170–5599:** solo `0.0.0.0:5040`, PID 7724 (el `svchost`).
- **`node` vivos:** ninguno.
- **Copias:**
  - en la de esta sesión (`scratchpad/c1a`) se quitaron las **151 uniones de paquete** con `[System.IO.Directory]::Delete(…, $false)`: quedan 0, y su `node_modules` solo conserva su propio `.vite-temp` y el `.package-lock.json` copiado;
  - la de la Fase 0 (`scratchpad/copia`) seguía sin unión;
  - el borrado de las dos está **denegado** por el modo auto, así que se quedan en el scratchpad sin unión.
- **`node_modules` del repo:** intacto (154 entradas; `vite`, `react` y `playwright-core` presentes).
- **`.vite` y `.vite-temp` del repo:** **sin escrituras de esta sesión**, idénticos a su foto de las 11:46 (23 entradas, fecha y tamaño).
- **`git status`:** los 5 residuos, este informe (modificado) y `laminas/pan1/` (sin rastrear). HEAD en `3d1b19e`. Sin `git add`.
- **Fuera del repo:** sondas (`sondaLam.mjs`, `genLam.mjs`, `verLam.mjs`), CSS de las variantes (`var/H|Z|V.css`) y JSON/logs (`lam/`), todo en el scratchpad.

**Parada aquí, en espera de la elección de Victor:** H, Z o V; la izquierda de la ✕ horizontal (punto 4); Tapetes (punto 1); el apilamiento de la revelación (punto 2).
