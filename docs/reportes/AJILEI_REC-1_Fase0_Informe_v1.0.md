# AJILEI · REC-1 · Recarga sin tapar la mesa
## Fase 0 · Informe de diagnóstico · v1.0

**Fecha:** 2026-09-25
**Ficha:** `AJILEI_REC-1_Fase0_v1.0.md`
**Base:** `main` en `736eb63`, sin commits ni `git add`
**Instrumento:** `capturas-rec/diagREC.mjs`, único script, contra 5173 con `VITE_AUTH_BYPASS=1`, Edge 153.0.4234.48 (playwright-core 1.62.1)
**Hoja:** `capturas-rec/hoja.html`, autocontenida, 1,8 MB, sin scroll horizontal a 412 px

---

## Resumen

### 1. Línea de tiempo del final de mano

El t = 0 es el primer fotograma de `PAYOUT`: sale el mensaje de resultado. Los tiempos los mide una sonda rAF que apunta cada cambio del DOM. Son cuatro corridas y las cuatro coinciden con ±25 ms.

| Hito | Forzosa pc | Forzosa S25 v | Automática pc | Automática S25 v |
|---|---:|---:|---:|---:|
| Última acción de una IA (crónica) | −853 | −929 | −804 | −986 |
| **Resultado + cartas de la ganadora boca arriba + `.win-score-chip` + `.card-winner` + «Tu mejor palo»** | **0** | **0** | **0** | **0** |
| **Se monta la tarjeta** | **0** | **0** | **0** | **0** |
| Tarjeta quieta (`bankruptRise` 0,32 s) | 320 | 323 | 334 | 329 |
| Empieza la sacudida de nombres (R2, mesas ≥ 3) | 1 504 | 1 495 | 1 493 | 1 489 |
| Sale el vuelo de fichas (`recoleccion`, al acabar `showdown.mp3`) | 2 079 | 2 084 | 2 081 | 2 081 |
| **Aterriza el vuelo: fin de la revelación** | **3 722** | **3 725** | **3 727** | **3 726** |
| Cronómetro «14 s» | 1 010 | 1 028 | 1 010 | 1 009 |
| Cronómetro «5 s» | 10 160 | 10 182 | 10 200 | 10 154 |
| Se cierra la tarjeta (vence el plazo) | 15 239 | 15 243 | 15 273 | 15 215 |
| Después | mesa desmontada → «Retar a las IAS» | ídem | vuelve «Siguiente mano» | ídem |

**La tarjeta no se adelanta a la revelación: sale en el mismo fotograma que ella.** `pideRecarga` devuelve `forzosa` o `automatica` en cuanto la fase es `PAYOUT`, y el efecto que abre la pregunta corre en el commit de ese mismo render. La revelación, el anuncio y los 3,7 s de celebración ocurren enteros **debajo** de la tarjeta. **El reloj consume 3,7 de sus 15 s** mientras el jugador aún no puede ver el resultado.

### 2. Qué tapa hoy cada tarjeta

| Tarjeta | Velo | Qué tapa |
|---|---|---|
| **Forzosa**, todas las celdas | `rgba(0,0,0,.62)` + `blur(4px)` a pantalla completa, `z-index 120` | **Todo**: resultado, cartas reveladas, pozo, capas, vuelo y mano. La caja tapa además el 100 % del mensaje, el 96–100 % del pozo y el 4–17 % de la mano. El velo captura el puntero: en mesas ≥ 3 **no se pueden tocar los nombres** para destapar las otras manos, que es justo lo que Victor echa de menos. |
| **Automática/voluntaria**, 1920×1080 | ninguno | Nada protegido: cae sobre el borde inferior de la zona del jugador, por debajo del marco. |
| **Automática/voluntaria**, 1366 · 1280 · 1024 | ninguno | El **100 % de «Tu mejor palo»** y el **24–27 % de la mano** del jugador. |
| **Automática/voluntaria**, S25 v | ninguno | El **100 % de la barra del jugador** (Tú, MANO, saldo, Mesa N). Cero sobre las cartas: la vara de A2 se cumple. |

### 3. Posiciones candidatas de la burbuja (120×40)

Las cuatro candidatas, en 13 celdas: las 10 de la ficha y las tres de escritorio intermedias. Coordenadas por celda en el §C.

| Candidata | Libre en | Ancla |
|---|---|---|
| **C1 · la ranura de «Siguiente mano»**, en la barra del jugador | **13/13** | `.player-bar .action-area`, la caja que O1 reserva a propósito mientras la recarga está abierta. Hoy es `static`: hay que darle `position: relative`, Δ = 0. |
| C4 · entre el óvalo y la mano del jugador, centrada | 8/13 | Falla en S25 h (mensaje o cartas IA) y en 360×640 (pozo o mensaje) |
| C3 · encima del saldo | 5/13 | Solo en vertical; en escritorio pisa la mano |
| C2 · arriba al centro, bajo la cabecera | 0/13 | Pisa los paneles de IA en todas |

**Recomendación: C1.** Es el sitio donde vivía «Siguiente mano», que la recarga ya bloquea. Mide 348×86 (S25 v), 326×92 (390), 296×68 (360), 0×84 en escritorio (la ranura está vacía y sin ancho) y 150×0 en S25 h.

### 4. Separaciones en escritorio frente a las varas de A5

Las cuatro celdas de escritorio (1920×1080, 1366×768, 1280×720 y 1024×768) dan **cifras idénticas**. Medidas con la tarjeta quieta.

| Medida | Forzosa escritorio | Vara forzosa | Blanda escritorio | Vara blanda | Forzosa S25 v | Blanda S25 v |
|---|---:|---:|---:|---:|---:|---:|
| Entre montos | **8** ✗ | ≥ 12 | **8** ✗ | ≥ 10 | 14 ✓ | 12 ✓ |
| Entre acciones | **10** ✗ | ≥ 12 | 10 ✓ (justo) | ≥ 10 | 14 ✓ | 12 ✓ |
| Montos → acciones | **0** ✗ | ≥ 16 | **0** ✗ | ≥ 12 | 18 ✓ | 14 ✓ |
| Acciones → cronómetro | **0** ✗ | ≥ 14 | **0** ✗ | ≥ 8 | 16 ✓ | 10 ✓ |
| Alto de los botones | **33** («Salir») y 37 («Recargar»); montos 40 | 40–44 | 37 (acciones), 40 (montos) ✓ | 36–40 | 42 ✓ | 36 ✓ |
| Alineación del cronómetro | centro (se pide **izquierda**) | — | centro ✗ | izquierda | centro (se pide izquierda) | izquierda ✓ |
| Ancho de la tarjeta | 468 | — | 428 | — | 380 | 380 |

**Por qué:** las reglas de A5 viven **solo** bajo `@media (max-width: 480px)`, en `apu.css:294-322` (blanda, vertical) y `apu.css:342-356` (forzosa). El escritorio no entra en ninguna y hereda la base: `.bankrupt-actions { gap: 10px }` (`gameTable.css:772-776`), `.apu-montos { gap: 8px }` (`apu.css:83-89`) y `.apu-plazo { margin: 0; text-align: center }` (`apu.css:106-114`).

---

## §0 · Línea base

| Punto | Resultado |
|---|---|
| `HEAD` | `736eb63` ✓ |
| `git status --short` al empezar | 6 sin seguimiento ajenos a REC-1: 2 informes de MOT-1, `laminas/mon1/` (3 archivos) y `scripts/_cel1bFila.mjs` |
| Pruebas | **35 archivos · 993 pruebas en verde** (vitest 4.1.8, 1,90 s) |
| Lint | **20 errores · 1 aviso**, la línea base esperada |
| `gate` (`diagDSK.mjs gate`) | **matriz 6/6 `ok`**, `matrixOk: true`. Reescribió sus 4 capturas `capturas-dsk/gate_after_*`, carpeta ignorada (`.gitignore:31`). |
| Servidor | 5173 con `VITE_AUTH_BYPASS=1` (200) |
| Navegador | Edge 153.0.4234.48. La línea base del arnés dice 151.0.4129.93: deriva ya conocida (memoria DSK). |

---

## §A · Las tres recargas en el código

### A.1 · La decisión

Una sola función pura decide: **`pideRecarga(state, saldo)`** en `src/hooks/mesaCore.js:233-245`.

| Forma | Condición exacta | Línea |
|---|---|---|
| Ninguna | fase ≠ `PAYOUT` y ≠ `WAITING`; o sin humano; o `unit ≤ 0`; o `topeRecarga(chips, unit, saldo) ≤ 0`, es decir, sin bolsillo o con la pila en el techo | `mesaCore.js:235`, `:238`, `:239` |
| **Forzosa** | `chips < unit` (no cubre el ante) **o** `anteDejaAMudos(state)` (D-12) | `mesaCore.js:241-242`; `anteDejaAMudos` en `:132-137` |
| **Automática** | `chips < umbral × unit`, con umbral 5 (`ajileiConfig.js:38`) | `mesaCore.js:243`; `pilaBaja` en `:148-150` |
| **Voluntaria** | todo lo demás | `mesaCore.js:244` |

**Cuándo se evalúa:** en cada render de la mesa (`GameTable.jsx:1097`, `const motivoRec = pideRecarga(game, saldo)`). Devuelve algo distinto de «ninguna» **desde el primer render de `PAYOUT`**.

### A.2 · Cuándo se monta

| Forma | Quién la abre | Momento |
|---|---|---|
| Forzosa y automática | efecto `GameTable.jsx:1147-1159`: `setRecarga({ motivo, monto })` y `setRecargaSeg(15)` | **En el commit del primer render de `PAYOUT`**, medido en t = 0 ms. En `WAITING` solo se abre la forzosa (`:1153`). Una vez por mano (`recargaPedidaRef` contra `handCount`, `:1145` y `:1154-1155`). |
| Voluntaria | botón «Recargar» junto a «Siguiente mano» (`GameTable.jsx:2307-2315`), solo si `motivoRec === VOLUNTARIA` | al pulsarlo; `recargaSeg = 0` |

### A.3 · Componente, clases y velo

Todo en `GameTable.jsx:2544-2602`: un `<div>` hermano del área, sin componente propio.

| Pieza | Clase | Dónde |
|---|---|---|
| Contenedor | `.bankrupt-overlay` + `.apu-suave` salvo en la forzosa (`:2546`); `data-accion="recarga"`, `data-motivo` | CSS base `gameTable.css:720-735`: `fixed; inset 0`, velo `.62`, `blur(4px)`, `z-index 120` |
| Caja | `.bankrupt-modal.apu-recarga` | `gameTable.css:737-756`: padding `38/42/34`, `max-width 380`, `width 90%`, `bankruptRise`; `apu.css:76-78` |
| Título y subtítulo | `.bankrupt-title`, `.bankrupt-sub` (`data-accion="recarga-sub"`) | `gameTable.css:758-770` |
| Montos | `.apu-montos` > `.btn.btn-mult.apu-monto` (`data-accion="recarga-monto"`) | `apu.css:83-96` |
| Acciones | `.bankrupt-actions` > `.btn-primary` (`recarga-si`) y `.btn-pass` (`recarga-no`) | `gameTable.css:772-778` (columna, `gap 10`) |
| Cronómetro | `.apu-plazo` (`data-accion="recarga-plazo"`), con `style={{ visibility }}` **en línea** (`:2597`) | `apu.css:106-114` |

**Velo:** la forzosa lo conserva. La automática y la voluntaria lo pierden con `.apu-suave`: sin fondo ni desenfoque, apoyadas abajo y con `pointer-events: none` en el contenedor y `auto` en la caja (`apu.css:141-159`). Esto es E-14.

Hay además un **modal de bancarrota** heredado (`GameTable.jsx:2606-2626`, se activa en `:1518`), que se trata en el §J-6.

### A.4 · El cronómetro

- **Nace** en `GameTable.jsx:371` (`recargaSeg`). Se carga en el efecto de apertura con `Math.round(plazoRecarga() / 1000)`, es decir, `betting.recarga.plazoMs = 15000` (`ajileiConfig.js:38`, `mesaCore.js:143`).
- **Arranca al montarse la tarjeta.** Primer tic a los ~1 010 ms del montaje.
- **Tic:** `GameTable.jsx:1169-1183`. Es un `setTimeout` de 1 s por segundo, se congela a oscuras (FRZ-1, `congelado`) y no corre en la voluntaria.
- **Al llegar a 0:** llama a `rechazarRecarga()` (`:1125-1133`). **Confirmado** en las dos formas:
  - en la forzosa llama a `salir()` (`:460`), `onLeave(human.chips)`, y la mesa se desmonta a los 15,24 s; se aterriza en «Retar a las IAS», que es `main.sal…`;
  - en la automática la pregunta se cierra y a los 15,2 s vuelve «Siguiente mano».

### A.5 · ¿Puede empezar la mano siguiente con la tarjeta abierta?

**No.** Lo bloquea **la mesa, no el motor ni las IAS**:
- la quinta condición del gate, `!recarga` en `GameTable.jsx:2278`, desmonta «Siguiente mano»;
- mientras tanto O1 reserva su ranura vacía (`:2326-2328`).

La fase se queda en `PAYOUT`. Las IAS no actúan fuera de las fases de apuesta. Siguen vivos la sacudida de nombres, el vuelo de fichas y el sonido, todo bajo el velo en la forzosa.

### A.6 · El motor

Participa **solo al cobrar**:
- `confirmarRecarga` (`GameTable.jsx:1101-1123`) llama a `aplicarRecarga` del motor para el humano y para cada IA que `nivelarLasIAS` devuelva.
- Por sus pruebas (`testMotorAPU1.test.js:351-361`), `aplicarRecarga` solo acepta entre manos (`WAITING`; en `BET_1` devuelve el mismo estado) y sube pila y `entrada`.
- `pideRecarga` importa del motor solo `PHASES`.

**La burbuja no necesita tocar el motor.** Todo lo que cambia es estado de pantalla: cuándo se muestra la pregunta y en qué forma. No hay obstáculo. (`gameEngine.js`, `aiPlayer.js` y `deck.js` no se abrieron.)

El normativo transcrito va en el **Anexo**.

---

## §B · La secuencia real del final de mano

### B.1 · Cómo se reproduce

- **Forzosa:** molde `?apu=saldo:5000,allinHumano`, mesa 5, Básico, apuesta 50, entrada Medio.
  - El humano se sienta con 1,5 apuestas y el ante lo deja en media.
  - El conductor pulsa All-in si existe; si no, iguala o pasa.
  - Si pierde, le quedan menos de un ante y sale la forzosa en `PAYOUT`. Si gana, se reintenta.
  - Salió **al primer intento** en pc y S25 v. En las 13 celdas del §C bastaron 1–3 intentos.
- **Automática:** `?apu=saldo:5000,recarga`: 3 apuestas, y el conductor pasa, iguala o se retira, **nunca All-in**.
  - En pc salió al primer intento.
  - En S25 v hicieron falta **11**: el primer conductor sí pulsaba All-in, y al perderlo salía la forzosa. Se cambió para las corridas siguientes.

### B.2 · Lo que ocurre, en orden

La tabla está en el Resumen §1.

1. **La última apuesta.** La crónica de la última IA cambia entre −0,80 y −0,99 s. La mano pasa a `PAYOUT` ~0,9 s después sin nada más en pantalla.
2. **La revelación es instantánea, no una coreografía.**
   - En t = 0 salen a la vez el mensaje (`.game-message[data-tono]`), las cartas de la ganadora boca arriba, `.win-score-chip`, `.card-winner`, «Tu mejor palo» y las capas del pozo, si las hay, en el mismo mensaje.
   - En mesas ≥ 3 el protocolo R1 enseña **solo la mano ganadora**. Las demás finalistas quedan en dorsos hasta que el jugador **toca su nombre**. La coreografía de volteo (`startRevealSwap`, `GameTable.jsx:1400-1423`) corre solo con ese toque.
   - La sacudida de nombres (R2, `:1458-1480`) arranca a +1,5 s para invitar al toque: 1 s de sacudida y 1,5 s de pausa, en bucle.
   - **Con el velo de la forzosa esos nombres no se pueden tocar.**
   - La ficha citaba `GameTable.jsx:5206-5276`: el archivo mide hoy 2 630 líneas (§J-2).
3. **El anuncio del ganador y del reparto del pozo** sale en t = 0, en el mismo renglón del mensaje. El pozo muestra su cifra retenida hasta que sale la primera moneda (VIS-3c).
4. **La celebración.** Si gana una IA, el nivel es `recoleccion`: vuelo de 7 fichas del pozo a la moneda de la ganadora. Espera a que acabe `showdown.mp3` y sale a +2,08 s. Aterriza a **+3,72 s** (`VIAJE_MS` 1 100 + 6 × 90 más el desvanecido).
5. **La tarjeta:**
   - **Se monta en t = 0**, antes de que termine todo lo anterior: la sacudida, el vuelo y el sonido.
   - En la forzosa, desde el primer fotograma el velo desenfoca la mesa entera. Del intervalo de 0 a 3,72 s no se ve nada nítido.
   - En la automática la mesa se ve, pero la tarjeta ya está encima de la barra o de la mano (Resumen §2).

### B.3 · Tiras de fotogramas

- **Archivos:** `capturas-rec/tira/`, 297 fotogramas JPEG, uno cada ~255 ms, de −2 s a +17 s. Nombre `<caso>_<m|p><ms>.jpg`, donde `m` es antes y `p` después del t = 0.
- **Casos:** `forzosa-pc` (74), `forzosa-s25v`, `automatica-pc` y `automatica-s25v`.
- **En la hoja**, §1, cada tira con su tabla de hitos. El fotograma en que aparece la tarjeta va enmarcado en rojo: **es el primero de `PAYOUT`**.
- **No hay un solo fotograma** con el resultado a la vista y sin tarjeta.

### B.4 · La automática

- Sale **también en t = 0** y con el mismo reloj.
- No tiene velo, pero tapa lo del Resumen §2. En S25 v, **toda la barra del jugador**, incluido el saldo que la recolección acaba de mover.
- Como la forzosa, gasta 3,7 s del plazo en plena revelación.

---

## §C · El espacio libre al terminar la revelación

### C.1 · Método

- **El estado:** la forzosa de verdad (molde `allinHumano`) en las 10 celdas de la ficha más 1366×768, 1280×720 y 1024×768.
- **El instante:** se espera a que aterrice el vuelo, entre 3,8 y 4,1 s tras el montaje. Entonces se **esconde la tarjeta por inyección** con `visibility: hidden !important` sobre el contenedor **y sus hijos (ver §J-8)**; como es `position: fixed`, no mueve nada. Se mide y se vuelve a mostrar.
- **Datos:** `capturas-rec/datos/celdas.json`. Imágenes: `capturas-rec/zonas/sin-tarjeta_<celda>.png`.
- **Cajas que no se pueden tapar:**
  - cartas de cada IA y sus paneles enteros (nombre, saldo, acción);
  - ALL-IN, medido por el rango de su texto;
  - `.game-message` (resultado y capas) y `.pot-box`;
  - `.win-score-chip`, `.score-tag` y «Tu mejor palo»;
  - la mano del jugador (`.player-zone .cards-row`);
  - la barra del jugador por sus hojas visibles (Tú, MANO/Pie, saldo, Mesa N) y los botones que haya en la ranura, que con la recarga abierta son ninguno;
  - el menú ⋮ y las hojas visibles de la cabecera (marca, «Mano #N», ✕).
  - El reloj de turno no existe en `PAYOUT`.
- **Zonas libres:** rejilla de 4 px, 6 px de margen alrededor de cada caja y 8 px al borde de la ventana. Rectángulos máximos ≥ 120×40, hasta 6 por celda. Están en la hoja (§2) y en `celdas.json`.

### C.2 · Zonas libres, resumen

| Celda | Zonas ≥ 120×40 (x,y w×h) — las mayores |
|---|---|
| pc · 5 | laterales fuera del marco 428×1064 y 404×1064; óvalo-derecha 604×132; arriba entre paneles 400×172 (×2); 252×120 |
| pc · 2 | laterales 540×1064 (×2); bajo el óvalo 636×64; 664×52; arriba 288×168 (×2) |
| 1366/1280/1024 · 5 | banda entre óvalo y mano a todo el ancho (1352×108 / 1264×84 / 1008×108); arriba, entre paneles |
| S25 v · 5 | (8,488) 396×116: la banda entre el óvalo y la mano; (8,344) 396×64 |
| S25 v · 2 | (140,260) 264×180; (8,484) 396×120; (8,260) 132×108 |
| 390 · 5 / 2 | (8,444) 376×88 · (140,328) 244×56 / (140,260) 244×144 · (8,448) 376×84 |
| 360 · 5 / 2 | (136,332) 216×40, **la única** / (140,236) 212×80 |
| S25 h · 5 / 2 | (8,172) 132×232 · (756,220) 152×184 · (564,172) 280×48 / (736,204) 172×200 · (8,224) 152×180 · (708,48) 200×108 |

**En 360×640 la mesa de 5 solo deja una zona de 216×40**, justo por encima del mínimo. Por eso la ranura reservada (C1) es la única candidata que no compite con el tapete.

### C.3 · Candidatas, por celda

Esquina superior izquierda de un rectángulo de 120×40, en px CSS.

| Celda | Ventana | **C1 · ranura** | C4 · entre óvalo y mano | C3 · sobre el saldo | C2 · bajo la cabecera |
|---|---|---|---|---|---|
| pc · 5 | 1920×1080 | (900,860) ✓ | (900,601) ✓ | ✗ mano | ✗ paneles IA + chip |
| S25 v · 5 | 412×915 | (146,749) ✓ | (146,563) ✓ | (260,777) ✓ | ✗ |
| S25 h · 5 | 915×412 | (768,288) ✓ | ✗ mensaje | ✗ fuera | ✗ mano |
| 390 · 5 | 390×844 | (135,674) ✓ | (135,492) ✓ | (238,706) ✓ | ✗ |
| 360 · 5 | 360×640 | (120,492) ✓ | ✗ pozo (22 px²) | (208,511) ✓ | ✗ |
| pc · 2 | 1920×1080 | (900,860) ✓ | (900,601) ✓ | ✗ mano | ✗ |
| S25 v · 2 | 412×915 | (146,749) ✓ | (146,563) ✓ | (260,777) ✓ | ✗ |
| S25 h · 2 | 915×412 | (748,288) ✓ | ✗ cartas IA | ✗ fuera | ✗ |
| 390 · 2 | 390×844 | (135,674) ✓ | (135,492) ✓ | (238,706) ✓ | ✗ |
| 360 · 2 | 360×640 | (120,491) ✓ | ✗ mensaje | (208,511) ✓ | ✗ |
| 1366 · 5 | 1366×768 | (623,675) ✓ | (623,452) ✓ | ✗ mano | ✗ |
| 1280 · 5 | 1280×720 | (580,627) ✓ | (580,404) ✓ | ✗ mano | ✗ |
| 1024 · 5 | 1024×768 | (452,675) ✓ | (452,452) ✓ | ✗ mano | ✗ |

### C.4 · Dónde se anclaría cada una (doctrina O1)

| Candidata | Contenedor | ¿Posicionado hoy? | Nota |
|---|---|---|---|
| **C1** | `.player-bar .action-area`: `display: flex; flex: 0 0 auto`; montada y vacía mientras `recarga` vive (`GameTable.jsx:2326-2328`) | **No, `static`.** El primer ancestro posicionado es `.player-zone` en escritorio y S25 h, y **ninguno** en vertical. | `position: relative` en una hoja nueva de REC es Δ = 0 por definición. Dentro va la burbuja absoluta y centrada (`left: 50%; top: 50%; translate(-50%,-50%)`). Así funciona igual con la ranura de 348×86 en vertical, de **0×84** en escritorio (la caja no tiene ancho: la burbuja desborda simétrica hacia los lados, y alrededor todo está libre) y de **150×0** en S25 h. **No debe ir en el flujo**: en escritorio le daría ancho a la columna central de un `grid` (`.player-bar` es `display: grid`) y eso sí podría mover «Tú» o el saldo. |
| C4 | `.player-zone` (`relative` en escritorio y S25 h; **`static` en vertical**) o `.center-zone` (`relative` en todas) | parcial | En vertical haría falta posicionar `.player-zone` o anclar en `.center-zone` con `top: 100%`. Falla en 5 celdas. |
| C3 | `.player-bar-right` / `.pbr-chips` (`static`) | no | Solo vale en vertical. |
| C2 | `.table-header` (`static`) | no | No vale en ninguna. |

**Propuesta: C1 como única posición.** C4 queda de reserva solo si la lámina quiere la burbuja más cerca del resultado, y entonces no vale en apaisado móvil ni en 360×640.

---

## §D · Las tarjetas en escritorio

### D.1 · Medidas

Medidas con la tarjeta quieta: se espera a que no quede ninguna animación `running` en la caja ni en el velo, y 450 ms más tras apartar el ratón (§J-7).

| Celda | Tarjeta | Ancho | Padding | Montos (alto · sep.) | Acciones (alto · sep.) | Montos → acc. | Acc. → cronómetro | Cronómetro |
|---|---|---:|---|---|---|---:|---:|---|
| 1920×1080 | forzosa | 468 | 38/42/34 | 40 · 8/8 | 37 y **33** · 10 (columna) | **0** | **0** | centro |
| 1366 · 1280 · 1024 | forzosa | 468 | ídem | 40 · 8/8 | 37 y **33** · 10 | **0** | **0** | centro |
| 1920 · 1366 · 1280 · 1024 | automática | 428 | 18/22/16 | 40 · 8/8 | 37/37 · 10 (fila) | **0** | **0** | centro |
| 1920 · 1366 · 1280 · 1024 | voluntaria | 428 | 18/22/16 | 40 · 8/8 | 37/37 · 10 | **0** | **0** | centro, oculto |
| S25 v (412×915) | forzosa | 380 | 22/14/20 | 42 · 14/14 | 42/42 · 14 | 18 | 16 | centro |
| S25 v | automática/voluntaria | 380 | 4/12 | 36 · 12/12 | 36/36 · 12 | 14 | 10 | izquierda |
| *S25 h (915×412)* | *forzosa* | *468* | *38/42/34* | *36 · 6/6* | *36 y **28** · 10* | ***0*** | ***0*** | *centro* |

Las cuatro celdas de escritorio dan **las mismas cifras al píxel**: no depende del ancho, porque la caja tope es la de `max-width: 380` más su padding. La forzosa en S25 h va aparte (§J-3).

### D.2 · Qué incumple el escritorio y por qué

- **Forzosa.** Incumple las cinco medidas: entre montos 8 < 12, entre acciones 10 < 12, montos → acciones 0 < 16, cronómetro 0 < 14, y altos 33 y 37, fuera de 40–44. «Salir con mis fichas» a **33 px** baja del piso táctil de 36. **Es la queja de Victor**: «Recargar 500» pegado a la fila de montos y «Se cierra en 13 s» pegado a «Salir».
- **Blanda.** Incumple tres de cinco: entre montos 8 < 10, montos → acciones 0 < 12, cronómetro 0 < 8. Además el cronómetro va centrado, no a la izquierda.
- **Por qué:**
  - **Las reglas de A5 van dentro de medios de teléfono:**
    - `apu.css:294-322` → `@media (max-width: 480px) and (orientation: portrait)` (blanda);
    - `apu.css:342-356` → `@media (max-width: 480px)` (forzosa);
    - `apu.css:255-269` → `@media (orientation: landscape) and (max-height: 520px)` (solo la blanda en apaisado móvil).
  - El escritorio no entra en ninguna y hereda la base de APU-1e:
    - `.apu-montos { gap: 8px; margin: 2px 0 0 }` (`apu.css:83-89`);
    - `.bankrupt-actions { flex-direction: column; gap: 10px }`, sin margen superior (`gameTable.css:772-776`);
    - `.apu-plazo { margin: 0; text-align: center }` (`apu.css:106-114`).
  - El `gap: 10px` de `.bankrupt-modal.apu-recarga` (`apu.css:76-78`) **no actúa**, porque la caja no es flex. Ya lo decía el comentario de `apu.css` §6, y sigue ahí.
  - **Los 33 px de «Salir»:** `.bankrupt-actions .btn-primary` lleva `padding: 11px 18px` (`gameTable.css:778`) y `.btn-pass` no, y en escritorio no hay `min-height`. El piso táctil de 40 px solo existe con puntero grueso.

### D.3 · La regla que haría falta, solo en `apu.css`

Es un bloque nuevo, aditivo, al final de `apu.css`:
- Va gateado con **el mismo medio de escritorio de la casa** (DSK: `(orientation: landscape) and (min-height: 601px)`), para no pisar el apaisado móvil, que tiene su presupuesto en §6.
- Solo el cambio de alineación del cronómetro va sin medio, porque la decisión de Victor vale para las dos tarjetas en todas las pantallas.
- Reutiliza las cifras de A5 con sus +2 px de E-32.

```css
/* §9 · REC-1 · el cronómetro, a la izquierda en las dos tarjetas (decisión de Victor) */
.apu-plazo { text-align: left; }

/* §10 · REC-1 · el aire de A5, llevado al escritorio */
@media (orientation: landscape) and (min-height: 601px) {
  /* forzosa: 40–44 · ≥12 · ≥16 · ≥14 */
  .bankrupt-overlay:not(.apu-suave) .apu-montos { gap: 14px; }
  .bankrupt-overlay:not(.apu-suave) .apu-monto { min-height: 42px; }
  .bankrupt-overlay:not(.apu-suave) .bankrupt-actions { margin-top: 18px; gap: 14px; }
  .bankrupt-overlay:not(.apu-suave) .bankrupt-actions .btn { min-height: 42px; }
  .bankrupt-overlay:not(.apu-suave) .apu-plazo { margin-top: 16px; }
  /* blanda: 36–40 · ≥10 · ≥12 · ≥8 */
  .bankrupt-overlay.apu-suave .apu-montos { gap: 12px; }
  .bankrupt-overlay.apu-suave .bankrupt-actions { margin-top: 14px; gap: 12px; }
  .bankrupt-overlay.apu-suave .apu-plazo { margin-top: 10px; }
}
```

Tres avisos antes de escribirla:
1. **La blanda crece ~24 px de alto.** Está anclada abajo (`align-items: flex-end`), así que crece hacia arriba. En 1366/1280/1024 ya tapa el 100 % de «Tu mejor palo» y el 24–27 % de la mano, y crecerá sobre ella. Si la automática pasa a burbuja (§F.5), solo queda la voluntaria, que la pide el jugador con la mano ya leída. Hay que medirlo en la Fase 1 y no darlo por bueno.
2. **La forzosa en vertical** conserva su `margin-top` de §8. La nueva regla de alineación la lleva a la izquierda. «La izquierda» de la forzosa es el borde de la caja de contenido, el mismo que el de los botones de ancho completo; en la blanda es el borde del subtítulo, que A5 ya comprueba.
3. **El arnés tiene la alineación sellada al revés:** `diagDSK.mjs:2103` pide `align: 'center'` a la forzosa. `VARA_BOTONES` tiene que pasar a `'left'`, y el modo `apu` debe medir también las celdas de escritorio contra las varas; hoy solo las aplica en vertical.

### D.4 · Capturas

En `capturas-rec/tarjetas/`:
- **forzosa:** `forzosa_<celda>-<mesa>.png` en las 13 celdas;
- **blandas:** `automatica_<vp>.png` y `voluntaria_<vp>.png` en pc, 1366, 1280, 1024 y S25 v.

La hoja (§3) las recorta y rotula:
- rojo: entre botones;
- ámbar: de los montos a las acciones;
- verde: hasta el cronómetro;
- gris: el alto de cada botón.

---

## §E · Multijugador (inventario)

- **No existe un camino de recarga en PvP.**
  - `src/screens/PartidaPvP.jsx` es un **stub** de 90 líneas (SAL-B2 F1b): no reparte, no tiene motor y no lee `estado_partida`.
  - No hay una sola mención a la recarga en `PartidaPvP`, `SalaEspera`, `salasApi` ni `salaPendiente`.
  - El normativo lo sella: §8 dice «**Sin recarga.**» y «nada de §5 ni §6»; §9 dice «recarga como acción que en PvP **no existe**».
- **Qué hace hoy la mesa contra IAS con la forzosa abierta:**
  - la fase se queda en `PAYOUT` y la mano siguiente no puede empezar (§A.5); las IAS no actúan;
  - la sacudida, el vuelo y el sonido siguen corriendo bajo el velo;
  - el plazo se detiene a oscuras (FRZ-1);
  - a los 15 s la mesa se levanta sola con las fichas que queden (§2.5) y el jugador aparece en «Retar a las IAS».
  - Es decir, **la mesa espera al jugador hasta 15 s**. En PvP eso no se puede hacer. La burbuja, que no bloquea la mesa, es el molde que PvP podría heredar si algún día la recarga existe allí; hoy no existe.

---

## §F · Propuesta para la Fase 1

### F.1 · Dónde se engancha la burbuja

**No hace falta componente ni estado nuevo de fondo.** Basta un campo más en la pregunta abierta y una condición más en el efecto de apertura.

1. **`recarga` gana un campo: `{ motivo, monto, abierta }`.**
   - El efecto de apertura (`GameTable.jsx:1147-1159`) la crea con `abierta: false`.
   - La voluntaria la sigue creando con `abierta: true` (`:2310`).
2. **Con `abierta: false`** se pinta la burbuja en la ranura C1. Con `true`, la tarjeta de hoy. La burbuja es el `triángulo + «Recargar» + cronómetro`.
3. **El reloj arranca al terminar la revelación, no al montar.** El efecto de apertura espera a `revelacionTerminada`:
   - sin showdown o sin vuelo, en el acto;
   - con vuelo, cuando la celebración se descarga (`celebracion.activa` pasa de armada a `null`, medido a +3,72 s).
   - Riesgo a vigilar: `activa` se arma en un `useLayoutEffect`, y el efecto pasivo del primer commit de `PAYOUT` podría leerla aún en `null`. Para no depender del orden de vaciado, la condición se deriva en render con los puros que ya existen: `llevaViaje(decideCelebracion({ phase, winner, humanCards, ruleN }))` dice si **habrá** vuelo; si lo habrá, se espera a verlo armado y luego descargado.
   - Idealmente es una función pura nueva en `mesaCore.js` (`recargaLista` o similar) para poder probarla con vitest.
4. **Un solo reloj.** `recargaSeg` (`:371`) y su tic (`:1169-1183`) no cambian: la burbuja y la tarjeta leen el mismo número.
   - Tocar la burbuja hace `setRecarga(r => ({ ...r, abierta: true }))` y no toca `recargaSeg`: el tiempo sigue donde iba.
   - **La apertura a los 5 s se deriva, sin segundo temporizador:** `abiertaEfectiva = recarga.abierta || recargaSeg <= 5`.
   - A 0 s sigue llamando a `rechazarRecarga()`. En la forzosa eso es «Salir con mis fichas».
5. **Sin velo mientras sea burbuja.**
   - El contenedor fijo `.bankrupt-overlay` **no se monta** hasta `abiertaEfectiva`. Así la mesa queda tocable y el jugador puede destapar las otras manos con R1/R2.
   - **No se debe esconder la tarjeta con `visibility` heredada:** el cronómetro lleva `visibility: visible` en línea (`:2597`) y se seguiría viendo (§J-8).
6. **O1:** la ranura reservada (`:2326-2328`) ya existe con la recarga viva. La burbuja va **absoluta** dentro de ella, y la ranura recibe `position: relative` en una hoja nueva (`rec.css`, patrón de `luz.css`/`rev.css`). Δ = 0.

### F.2 · ¿Motor?

**No.** `pideRecarga`, `aplicarRecarga`, `nivelarLasIAS`, `confirmarRecarga` y `rechazarRecarga` quedan como están. No hay obstáculo.

### F.3 · Pruebas

| Hoy | Qué cubre | ¿Cambia? |
|---|---|---|
| `scripts/testMesaAPU1.test.js` §5 (líneas 578-700) | listón, tope, validez, montos, **cuál de las tres toca** (`pideRecarga`) y nivelado | No, si `pideRecarga` no se toca |
| `scripts/testMotorAPU1.test.js:351-361` | `aplicarRecarga` solo entre manos | No |
| `scripts/testEliminations.test.js:197-205` | humano quebrado con ≥ 2 vivos → la mesa sigue | No |
| `src/config/textos.test.js:146-196` | claves `ia.recarga.*` y la lista blanca de **valores duplicados** | **Sí, si la burbuja reutiliza «Recargar»** con una clave nueva: el valor coincide con `ia.recarga.pedir` y la prueba de duplicados lo marcará. O se reutiliza la clave o se añade a la lista blanca. |

**Pruebas que hay que añadir** (puras, en `mesaCore`; el proyecto no tiene jsdom y el componente no se puede probar con vitest):
- `recargaLista(...)`: sin vuelo → en el acto; con vuelo → no hasta que se descargue.
- `formaRecarga(seg, abierta, motivo)`:
  - `burbuja` con > 5 s y sin tocar;
  - `tarjeta` al tocar, **sin reiniciar el reloj**;
  - `tarjeta` a ≤ 5 s sola;
  - `vence` a 0;
  - la voluntaria siempre `tarjeta` y sin plazo.
- El número que se pinta es el mismo en burbuja y tarjeta: continuidad por construcción.

### F.4 · El arnés

**Propuesta: un modo nuevo `rec` en `diagDSK.mjs`, no una extensión de `apu`.**
- Necesita la sonda rAF de línea de tiempo de `diagREC.mjs` y la caza de la forzosa real. `apu` es de geometría quieta, y mezclarlos le cambiaría el tiempo de corrida y la lectura.
- `apu` sí cambia por la sección D: pasa `forzosa.align` a `'left'` y aplica sus varas también en escritorio.

Puertas de `rec`, en las 10 celdas (mesas 5 y 2 × pc, S25 v, S25 h, 390 y 360):
1. **No tapa:** la caja de la burbuja pisa 0 px² de las cajas del §C.
2. **Δ = 0:**
   - se miden las cajas de `.player-zone`, la barra, las cartas y el óvalo con la burbuja montada;
   - se comparan con las mismas cajas en `PAYOUT` con la ranura reservada y sin burbuja;
   - se descuentan los `transform` en vuelo (lección E-33).
3. **El reloj arranca al terminar la revelación:** el primer «15 s» visible cae a ≥ `vueloFin` y no en t = 0.
4. **Reloj continuo:** se toca la burbuja a los N s y la tarjeta enseña N (±1) sin volver a 15.
5. **Apertura sola:** a «5 s» la tarjeta está montada sin tocar nada.
6. **Vence:** a 0 s la forzosa desmonta la mesa y la automática devuelve «Siguiente mano».
7. **Sin velo:** mientras sea burbuja, un clic en el nombre de una IA no ganadora (mesa 5) la destapa.

### F.5 · La automática

**Los datos dicen que tiene el mismo problema:**
- se monta en t = 0;
- consume 3,7 s del plazo durante la revelación;
- tapa la barra entera en S25 v, y «Tu mejor palo» y un cuarto de la mano en 1024–1366.

**Se propone tratarla igual:** burbuja en C1, reloj desde el final de la revelación y apertura sola a los 5 s. Como su defecto es «No recargar», al vencer se cierra y vuelve «Siguiente mano»; la burbuja no cambia eso. Lo decide el rector con Victor (§K-2). Si se aprueba, en escritorio solo la voluntaria conserva la tarjeta apoyada abajo, y el aviso 1 del §D.3 pierde casi todo su peso.

### F.6 · Estimación de la Fase 1, en minutos de Claude Code

| Parte | Contenido | Minutos |
|---|---|---:|
| **Burbuja** | `recarga.abierta`, `recargaLista`/`formaRecarga` puros con pruebas, JSX de la burbuja en la ranura, `rec.css` (ranura `relative`, burbuja, triángulo), textos, modo `rec` con 7 puertas × 10 celdas, capturas y hoja | **180–240** |
| **Espaciado de escritorio** | bloques §9/§10 de `apu.css`, `VARA_BOTONES` y el modo `apu` en las 4 celdas de escritorio, y la medida del crecimiento de la blanda sobre la mano | **45–60** |

---

## §J · Hallazgos

1. **El normativo y el código no dicen lo mismo sobre la forzosa.**
   - §5.1 la sitúa «**al arrancar una mano**». El código la evalúa y la monta **al cerrar la mano**: `pideRecarga` acepta `PAYOUT` (`mesaCore.js:235`) y se mide en t = 0 del pago.
   - §5.1 da los 15 s solo a la automática, pero el código los aplica también a la forzosa. El comentario de `GameTable.jsx:1161-1163` cita «§5.4: misma pantalla, mismo plazo», y esa frase **no está** en §5.4 de la v1.1 (Anexo).
   - La enmienda del normativo que traiga la burbuja puede cerrar las dos cosas.
2. **La referencia de la ficha a `GameTable.jsx:5206-5276` ya no existe.** El archivo mide 2 630 líneas. La revelación automática es instantánea en t = 0. La única coreografía, `startRevealSwap` (`:1400-1423`), la dispara un toque.
3. **La forzosa en el teléfono apaisado no la cubrió A5.** En S25 h (915×412): «Salir con mis fichas» a **28 px**, montos a 36, 6 px entre montos, y 0 y 0 hacia acciones y cronómetro. El §8 de `apu.css` solo mira `max-width: 480px` y el §6 solo la blanda. 640×360 y 844×390 no se midieron, pero comparten reglas. Ni la regla de escritorio del §D.3 ni la burbuja lo arreglan: la forzosa se sigue abriendo a los 5 s.
4. **`gap` inerte en `.bankrupt-modal.apu-recarga`** (`apu.css:76-78`, y `:194` en §4): la caja no es flex. Ya estaba anotado en el propio `apu.css` §6. Es inocuo, pero confunde a quien lea las reglas.
5. **El molde `allinHumano` descuenta del saldo la entrada elegida (1 000) y sienta al humano con 75.** Tras la forzosa el saldo se queda en 4 000 cuando debería ser 4 925. Solo es desarrollo (`import.meta.env.DEV`) y no afecta a producción, pero cualquier medida del saldo con ese molde sale falsa.
6. **El modal de bancarrota heredado puede ser inalcanzable.** Deducido, no reproducido.
   - Se abre solo si `startHand` devuelve `GAME_OVER` **y** el humano está eliminado **y** `aliveCount ≥ 2` (`GameTable.jsx:1518`).
   - Según `testEliminations.test.js:197-205`, con el humano quebrado y ≥ 2 vivos el motor ya no da `GAME_OVER`: la mesa sigue en `DEAL_2`.
   - Y con saldo 0, `pideRecarga` devuelve «ninguna», así que «Siguiente mano» se ofrece.
   - Lo esperable es que el humano quede **eliminado y mirando** una mesa que sigue.
   - No es de REC-1, pero es el camino de la forzosa sin bolsillo, y la burbuja no lo toca. Se sugiere una sonda aparte.
7. **Instrumento: el hover de `.btn` se mueve.**
   - Justo después de apartar el ratón, el botón que estaba bajo el puntero sigue 2 px arriba por la transición del hover. La voluntaria dio −35 y −2 en la primera pasada.
   - Hace falta esperar ~450 ms tras `mouse.move`, igual que `esperarTarjetaQuieta` espera a `bankruptRise`. `diagDSK apu` mueve el ratón y mide sin esa espera en algunos caminos: conviene revisarlo.
8. **`visibility: visible` en línea en `.apu-plazo`** (`GameTable.jsx:2597`). Esconder la tarjeta con `visibility: hidden` en el contenedor **no esconde el cronómetro**, porque el valor en línea gana a la herencia. Me pasó en la primera pasada de capturas y se repitió con la regla aplicada también a los hijos. **La Fase 1 no debe implementar «burbuja = tarjeta escondida» por `visibility`:** hay que desmontar o usar `display`.
9. **Archivo fuera de la carpeta autorizada.** Para revisar la hoja a 412 px creé `_verhoja_tmp.mjs` **en la raíz del repositorio**, porque `playwright-core` no se resolvía desde la carpeta temporal. El borrado me fue denegado y **sigue ahí sin seguimiento**. Hay que borrarlo a mano. No contiene nada del producto: abre `capturas-rec/hoja.html` y la fotografía.
10. **Deriva del navegador:** Edge 153.0.4234.48, frente a la base 151.0.4129.93 del arnés. Ya estaba en observación (memoria DSK). Ninguna cifra de este informe se compara con una línea base sellada.

## §K · Preguntas al rector

Solo las que bloquean la lámina o la Fase 1.

- **K-1 · ¿Qué es «terminar la revelación»?** La propuesta es el aterrizaje del vuelo, a +3,72 s, con la mesa tocable. O, en una mano sin vuelo (retirada, sin geometría), en el acto. ¿O un plazo fijo? En mesas ≥ 3 el jugador puede seguir destapando manos después; la burbuja no se lo impide.
- **K-2 · ¿La automática también pasa a burbuja?** Los datos del §F.5 apuntan a que sí. Cambia la estimación y la tabla de pruebas.
- **K-3 · ¿La tarjeta abierta desde la burbuja se puede volver a plegar?** Cambia el dibujo de la lámina (una ✕ o «Ver la mesa») y una puerta del arnés.
- **K-4 · ¿El §J-3 (forzosa en el teléfono apaisado, «Salir» a 28 px) entra en la Fase 1 de REC-1 o va aparte?** Con la burbuja esa tarjeta se sigue abriendo a los 5 s, así que el defecto sobrevive.

---

## Anexo · Normativo transcrito literalmente

De `docs/AJILEI_APU-1_Reglas_v1.1.md`: §2.4, §2.5, §5 entero, §8, la parte pertinente del §9 y las filas de recarga del §10.

> ### 2.4 Ante por mano — SELLADO
>
> Cada mano cobra **un ante = apuesta de mesa** a cada jugador vivo. La entrada compra la pila; el ante la erosiona; la recarga (§5) existe para eso.
>
> - **Quien no cubre el ante queda fuera**: una IA se va (§6.10); el humano pasa por la recarga forzosa (§5.4). El corte es «menos de un ante», y el residuo (< `unit`) regresa al saldo (§2.5).
> - **El ante que deja la pila en cero marca all-in** (1d, D-7): quien paga el ante con su última ficha sigue disputando la mano por sus capas. Y quien abre la ronda salta al all-in (`primerTurno`).
>
> ### 2.5 Salida de la mesa — SELLADO
>
> Al abandonar la mesa por cualquiera de las cuatro vías (✕ de cabecera, fin de mesa, recarga forzosa rechazada, pantalla de victoria) **las fichas restantes regresan al saldo de sesión**. Salir estando arriba es legítimo. El resultado se cuenta contra la **entrada**: `fichas − entrada`, con lo recargado contado como dinero **puesto**, no ganado (§5.3).

> ## 5. Recarga entre manos — SELLADO (solo vs IAS)
>
> ### 5.1 Las tres formas
>
> Una sola función pura (`pideRecarga`) decide cuál toca:
>
> - **Voluntaria**: botón discreto junto a «Siguiente mano», al cierre de **cada mano a partir de la primera** (no antes de repartir la primera: el jugador acaba de elegir su entrada).
> - **Automática**: al cerrar una mano, si `pila_humano < 5 × unit` y el saldo alcanza. **15 segundos** (1f; la v1.0 decía 10), «No recargar» por defecto. Bloquea «Siguiente mano» y **reserva su caja** (O1).
> - **Forzosa**: al arrancar una mano, si el humano no cubre el ante **o** si el ante dejaría a todos mudos (D-12, ruta 1). Rechazarla («Salir con mis fichas») termina la mesa y devuelve las fichas al saldo (§2.5).
> - **Nunca dentro de una mano.** Sin saldo no hay pregunta.
>
> ### 5.2 Cuánto
>
> La recarga se elige como una entrada: **Mínimo 10× · Medio 20× · Al techo** (lo que falta para llenar la mesa), múltiplos de la apuesta, pila resultante ≤ techo, saldo suficiente. Los inalcanzables se apagan, no se esconden. Cuatro validaciones: múltiplo, techo, saldo, entre manos.
>
> ### 5.3 Efecto en las IAS
>
> Tras la recarga cada IA viva se **completa hacia arriba** con la misma fórmula de §2.3:
>
> ```
> pila_IA = max( pila_IA_actual , min( round( pila_humano_tras_recarga × FACTOR_IA ) , techo ) )
> ```
>
> A la IA que va por encima no se le quita nada; las eliminadas **no vuelven**. `aplicarRecarga` sube pila y `entrada` a la vez, por eso el resultado sigue siendo honesto (§2.5). **La promesa se dice antes de pulsar**, en el subtítulo de la tarjeta, en todas las pantallas: «Quedan {hc} HC. Las IAS se nivelan contigo.» (automática) · «Hasta {hc} HC más. Las IAS se nivelan contigo.» (voluntaria). No hay una nota aparte en escritorio (E-31). El tutorial explica la nivelación una vez (TUT-1).
>
> ### 5.4 Lámina — SELLADO (E-14, E-29)
>
> La **forzosa** bloquea la mesa: detrás no hay nada que mirar. La **automática** y la **voluntaria** se apoyan abajo, **sin velo**, con el resultado de la mano y las cartas del jugador visibles; en 360×640 la tarjeta mide ≤ 142,78 px y no toca las cartas (0 px²). Lo único que bloquean es «Siguiente mano».

> ## 8. Lo que hereda el macro 2 (Jugar vs jugador) — sin cambio respecto a la v1.0
>
> Motor y `pozos.js` idénticos. Solo cambian interfaz y base de datos:
>
> - Sin niveles. Siete apuestas: `50 · 100 · 200 · 500 · 1.000 · 2.000 · 5.000`.
> - Entrada por jugador fija, dos opciones: **Corta 15×** · **Llena 50×**, en HC. Flujo: jugadores → apuesta → entrada. *(Nota del rector: el Medio de vs IA pasó a 20× en 1f; la Corta de PvP sigue sellada en 15×. Decisión de Victor al abrir el macro 2 si conviene alinearlas.)*
> - Identidad de mesa abierta: jugadores × apuesta × entrada. Para sentarse: saldo ≥ entrada.
> - Pila en la mesa siempre visible; el saldo total nunca. **Sin recarga.** «Ocultar saldo» del menú: existe sin activar; por decidir si se retira o se reasigna a la billetera.
> - Todo §4 aplica idéntico; nada de §5 ni §6.
> - Mano de la primera mano: cada jugador elige una carta al azar; gana el nominal más alto (el 12 es el mayor); empate → solo los empatados repiten con las que quedan. Lo ejecuta el servidor.

> ## 9. Lo que el contrato del árbitro de MOT-1 necesita
>
> Sin cambio en las ediciones (APU-1 escribió las 1, 4, 5 y 6 de K-1(a)). Lo nuevo que el árbitro hereda: `pozos.js` con sus once motivos de rechazo; forma del estado (`contribMano`, `allIn`, `entrada` por jugador; `pot` entero con capas derivadas); **`abrirApuesta`** (una fase con ≤ 1 pendiente no se abre); rechazo de acción ilegal devuelto al cliente; recarga como acción que en PvP **no existe**; generador inyectable en `deck.js` y `aiPlayer.js`.

> ## 10. Tabla de parámetros *(filas de la recarga)*
>
> | Parámetro | Valor | Clase | Dónde vive |
> |---|---|---|---|
> | Listón de recarga automática | pila < 5× unit | SELLADO | `betting.recarga.umbral` |
> | Plazo de la pregunta | 15 s, defecto «No» | SELLADO (1f) | `betting.recarga.plazoMs` |
> | Montos de recarga | 10× · 20× · al techo | SELLADO | derivados de `entrada.js` |
