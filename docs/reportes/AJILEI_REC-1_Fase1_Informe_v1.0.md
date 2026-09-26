# AJILEI · REC-1 · Fase 1 · Informe v1.0
## Recarga sin tapar la mesa: tarjetas con aire y burbuja

**Fecha:** 2026-09-26
**Ficha:** `AJILEI_REC-1_Fase1_v1.0.md` · **Base:** `main` en `736eb63`, sin commits
**Normativo:** `docs/AJILEI_APU-1_Reglas_v1.2.md` (creado en esta fase)
**Hoja:** [capturas-rec/fase1/hoja.html](../../capturas-rec/fase1/hoja.html) (1,28 MB, autocontenida, sin scroll horizontal a 412 px)
**Instrumento:** modo `rec` de `scripts/diagDSK.mjs` (nuevo) y modo `apu` ajustado, contra 5173 con `VITE_AUTH_BYPASS=1`, Edge 153.0.4234.48

---

## Resumen

- **La burbuja funciona como pide el normativo v1.2 §5.5.**
  - Aparece al aterrizar el vuelo de fichas: el primer «15» visible cae en **+3 726 a +3 740 ms**, en el mismo fotograma que el aterrizaje, en los cuatro casos. **La red de 6 s no saltó nunca.**
  - Las siete puertas del modo `rec` están **en verde**.
  - La burbuja pisa **0 px²** de lo protegido y mueve **0 px** la maqueta en las **13 celdas**.
  - El anillo cumple su vara con margen: **34 px**, número de **14 px a 700** y contraste **9,66:1**.
- **Las tarjetas tienen el aire de A5 en todas las pantallas.**
  - Escritorio: forzosa **14 · 14 · 18 · 16** y blanda **12 · 12 · 14 · 10** (entre montos · entre acciones · montos → acciones · acciones → cronómetro).
  - Teléfono apaisado: la forzosa compacta va en fila, con las acciones a **42 px**. «Salir con mis fichas» pasa de 28 a **42 px**.
  - El cronómetro va a la izquierda en las dos tarjetas.
  - El modo `apu` da **7/7 celdas** con las varas nuevas (360×640 necesitó una segunda corrida; ver §4, D-5).
- **Qué cuesta.**
  - En escritorio, la **automática abierta** crece **+45,11 px** hacia arriba y tapa el **73,6 %** de la mano en 1024, 1280 y 1366 (en la Fase 0, el 24–27 %). Solo ocurre si el jugador la abre o en los últimos 5 s. **Se reporta, no se da por bueno** (§1.3).
  - En 360×640 la automática solo cabe **sin título**, como en la lámina (desviación D-1).
- **Comprobaciones finales.**
  - Pruebas **1 006/1 006** (+13 nuevas).
  - Lint en la línea base: 20 errores + 1 aviso.
  - `gate` 6/6; `luz` y `rev` VERDES.
  - Build limpio; ningún protegido tocado; el motor, sin abrir.

---

## 1. Parte A · Las tarjetas con aire

### 1.1 Qué se cambió (solo `apu.css`, bloques nuevos al final)

- **§9 · la fila del cronómetro, en todas las pantallas.**
  - El cronómetro va a la izquierda en las dos tarjetas.
  - El `<p>` del plazo vive en una fila, `.apu-plazo-fila`, con «Ver la mesa» a su derecha.
  - El aire que A5 le daba al `<p>` pasa a la fila. Si se hubiera quedado en el `<p>`, el botón de al lado quedaría pegado a las acciones.
  - La fila de la automática y la forzosa (`.rec-plazo-fila`) guarda el alto del botón aunque no esté: 38 px, 36 en vertical. Así, cuando el botón se va a los 5 s, la tarjeta no encoge. Está anclada abajo, y si encogiera todo lo de encima bajaría bajo el dedo.
  - La fila no depende de la herencia de `visibility` (§J-8 de la Fase 0).
- **§10 · el aire de A5 en escritorio**, con el bloque `(orientation: landscape) and (min-height: 601px)` que proponía la Fase 0 en su §D.3, con la holgura de E-32.
- **§11 · la forzosa compacta en el teléfono apaisado**, con `(orientation: landscape) and (max-height: 520px)`:
  - acciones en fila de 42 px, con 14 px entre ellas;
  - montos de 38 px, con 12 px entre ellos;
  - 14 px de los montos a las acciones y 10 px de las acciones al cronómetro;
  - la cabecera más apretada.
- **§12 · la automática en vertical estrecho, sin título** (D-1).

### 1.2 Medidas antes y después, por celda y por tarjeta

Separaciones en px: entre montos · entre acciones · montos → acciones · acciones → cronómetro. Alto de los botones, en px. Medido con la tarjeta quieta y 450 ms después de apartar el ratón (§J-7).

| Celda | Tarjeta | Antes | Después | Botones antes → después | Cronómetro | «Ver la mesa» | Vara |
|---|---|---|---|---|---|---|---|
| 1920×937 | forzosa | 8 · 10 · **0** · **0** | 14 · 14 · 18 · 16 | 37 y **33** → 42 | centro → izquierda | 38 | ✓ |
| 1366 · 1280 · 1024 | forzosa | 8 · 10 · **0** · **0** | 14 · 14 · 18 · 16 | 37 y **33** → 42 | centro → izquierda | 38 | ✓ |
| 1920×937 | automática | 8 · 10 · **0** · **0** | 12 · 12 · 14 · 10 | 37–40 → 37–40 | centro → izquierda | 38 | ✓ |
| 1366 · 1280 · 1024 | automática | 8 · 10 · **0** · **0** | 12 · 12 · 14 · 10 | 37–40 → 37–40 | centro → izquierda | 38 | ✓ |
| 915×412 (S25 h) | forzosa | 6 · 10 · **0** · **0** | 12 · 14 · 14 · 10 | 36 y **28** → 38 / 42 | centro → izquierda | 38 | ✓ compacta |
| 844×390 | forzosa | sin medir (Fase 0: mismas reglas que S25 h) | 12 · 14 · 14 · 10 | → 38 / 42 | izquierda | 38 | ✓ compacta |
| 640×360 | forzosa | sin medir | 12 · 14 · 14 · 10 | → 38 / 42 | izquierda | 38 | ✓ compacta |
| 360×640 | forzosa | 14 · 14 · 18 · 16 | 14 · 14 · 18 · 16 | 42 → 42 | centro → izquierda | 36 | ✓ (sigue verde) |
| 360×640 | automática | 12 · 12 · 14 · 10 | 12 · 12 · 14 · 10 | 36 → 36 | izquierda | 36 | ✓ (sigue verde), 0 px² sobre las cartas |
| 640×360 · 844×390 | automática | 8 · 10 · 10 · **0** | 8 · 10 · 10 · 10 | 36 → 36 | centro → izquierda | 38 | ✓ (vara de A4) |

- **La forzosa compacta cabe entera** con aire de sobra:
  - alto **222,48 px**;
  - arriba en 68,75 (640×360), 83,75 (844×390) y 94,75 (915×412);
  - ≥ 68 px de aire arriba y abajo, frente a ≥ 8 pedidos.
- **En vertical la forzosa crece** de 314,39 a **334,8 px**, por la fila de 36 px. Sigue centrada y bloqueando a propósito.

### 1.3 Cuánto crece la blanda en escritorio, y qué tapa de más

| Celda | Alto Fase 0 | Alto ahora | Crece | Mano tapada, antes → ahora | «Tu mejor palo» |
|---|---:|---:|---:|---|---|
| 1920×937 | 194,17 | 239,28 | +45,11 | — → **20,7 %** | 100 % |
| 1366×768 | 191,28 | 236,39 | +45,11 | 24–27 % → **73,6 %** | 100 % |
| 1280×720 | 191,28 | 236,39 | +45,11 | 24–27 % → **73,6 %** | — (no visible) |
| 1024×768 | 191,28 | 236,39 | +45,11 | 24–27 % → **73,6 %** | 100 % |

- **Por qué crece +45,11 px:**
  - unos 24 px son el aire de A5 (14 hasta las acciones y 10 hasta el cronómetro, donde antes había 0 y 0);
  - unos 21 px, la fila de «Ver la mesa» (38 px en vez de los 17 del renglón del plazo).
- **Cuándo ocurre:** con la automática en burbuja, solo cuando el jugador la abre o en los últimos 5 s.
  - La voluntaria no lleva la fila de «Ver la mesa»: crece solo por el aire, unos +24 px. **No se midió en esta fase.**
- **No se da por bueno.**
  - El jugador que abre la automática para decidir ya vio la mano. Aun así, tapar tres cuartos de sus cartas contradice «las cartas del jugador visibles» del §5.4.
  - Queda como pregunta K-1 (§6).
- **En el teléfono apaisado** la blanda pasa de 168,38 a **200,78 px** (+32,4) y tapa el 100 % (640×360) o el 91 % (844×390) de la mano. Victor ya había aceptado que en apaisado tape (A4). Se reporta igual.

---

## 2. Parte B · La burbuja

### 2.1 El contrato implementado

**`src/hooks/mesaCore.js`** (puro, con pruebas):

- `APERTURA_SOLA_S = 5` y `RED_REVELACION_MS = 6000`.
- `recargaLista({ vuelo, armada, descargada, ms })`:
  - sin vuelo, lista;
  - con vuelo, lista cuando la celebración se armó **y** se descargó;
  - `ms ≥ 6 000`, lista siempre (la red).
- `formaRecarga({ seg, abierta, motivo })` devuelve `{ forma, plegable }`:
  - voluntaria → tarjeta, no plegable;
  - `seg ≤ 0` → vence;
  - `seg ≤ 5` → tarjeta fija;
  - `abierta` → tarjeta plegable;
  - si no → burbuja.
- `abrirRecarga(r)` y `plegarRecarga(r, seg)` cambian solo `abierta`. `plegarRecarga` se niega a plegar con `seg ≤ 5` o en la voluntaria.

**`src/components/GameTable.jsx`:**

- **La pregunta:**
  - `recarga` gana `abierta`: la automática y la forzosa nacen plegadas y la voluntaria abierta.
  - El efecto de apertura sigue cargando `recargaSeg = 15`, pero el tic de siempre **no corre hasta `recargaLista`** (ver D-2).
  - `pideRecarga`, `confirmarRecarga`, `rechazarRecarga`, `nivelarLasIAS` y el bloqueo de «Siguiente mano» no cambian.
- **Cómo se sabe que terminó la revelación:**
  - Se anota por mano (`handCount`) si `celebracion.activa` llegó a existir y si volvió a null. Se hace **durante el render**, con el molde de React para guardar algo del render anterior, porque un `setState` síncrono en un efecto era un error nuevo de lint.
  - Un temporizador de 6 s hace de red.
  - Un vuelo cortado por un toque en un nombre también cuenta como descargado: la revelación la cerró el jugador.
- **Qué se pinta según la forma:**
  - Con **`burbuja`**, `<BurbujaRecarga>` va dentro de la ranura reservada, que gana la clase `rec-ranura`, y el overlay **no se monta**.
  - Con **`tarjeta`**, la de siempre. Si es plegable, lleva «Ver la mesa» en la fila del cronómetro.
- **Para el arnés**, la mesa publica `data-rec-motivo`, `data-rec-lista` y `data-rec-red`. La pregunta pendiente ya no se ve en el DOM hasta el fin de la revelación.
- **Forzosa entre manos:** «Iniciar mano» se gatea con `!recarga` (hallazgo H-1).

**`src/components/BurbujaRecarga.jsx` y `src/styles/rec.css`:**

- **El botón:**
  - un `<button>` (`SoundButton`) con la doctrina `font: inherit; padding: 0; line-height: 1`;
  - `aria-label` según la forma: «Recargar fichas, quedan N segundos» o «Recargar fichas (opcional), quedan N segundos»;
  - no lleva `.btn`, porque el `translateY(-2px)` del hover pelearía con el centrado.
- **El anillo:** SVG de 34 px, fondo al 22 % y trazo `--gold-brand` con `stroke-dashoffset = L × (1 − seg/15)`. Arranca arriba y **no lleva transición**.
- **El icono:** triángulo en la forzosa y la Heptacoin (`heptacoin.svg?no-inline`) en la automática.
- **El aspecto:** 40 px de alto, `rgba(9,23,14,.94)`, filo de 1,5 px `rgba(232,184,75,.7)`, radio 999, sombra `0 4px 14px rgba(0,0,0,.5)`, `--font-base` 700 a 15 px.
- **La entrada:** fundido y 8 px en 0,32 s; ninguna con `prefers-reduced-motion`.
- **El anclaje:** `rec.css` da `position: relative` a la ranura reservada y pone la burbuja absoluta y centrada. Se importa como último import de `GameTable.jsx`, tras `rev.css`.

**Textos** (`textos.es.js`):

- «Recargar» reutiliza `ia.recarga.pedir`, con el mismo valor.
- Nuevas: `ia.recarga.vermesa` (D-3), `ia.recarga.aria.forzosa` e `ia.recarga.aria.automatica`.

### 2.2 Pruebas

`scripts/testRecargaREC1.test.js`: **13 pruebas**, todas en verde.

- **La red:** sin vuelo, lista en el acto; con vuelo, no hasta que se arma y se descarga; descargada sin armar no cuenta; la red a 5 999 y a 6 000 ms.
- **Las cinco ramas de `formaRecarga`.**
- **Un solo reloj:** una secuencia 15 → 1 que abre, pliega, reabre e intenta plegar a 3 s. `seg` recorre 15…1 sin saltos, la forma sigue lo esperado y el objeto no gana ningún campo de reloj.
- **Los pliegues imposibles:** plegar a ≤ 5 s y plegar la voluntaria no hacen nada.

Total del proyecto: **36 archivos, 1 006 pruebas** (993 + 13).

### 2.3 Las siete puertas, celda a celda

`node scripts/diagDSK.mjs rec` → datos en `capturas-rec/fase1/datos/celdas.json` y `reloj.json`.

**Puertas 1 y 2, forzosa, 13 celdas.** En todas la ranura reservada está libre (Fase 0 §C.4); todas quedan en ✓.

| Celda | Burbuja (x, y, ancho × alto) | 1 · pisa | 2 · Δ | Velo con burbuja |
|---|---|---:|---:|---:|
| pc-5 / pc-2 | 882,48, 860 · 155×40 | 0 | 0 | 0 |
| d1366-5 | 605,48, 675 | 0 | 0 | 0 |
| d1280-5 | 562,48, 627 | 0 | 0 | 0 |
| d1024-5 | 434,48, 675 | 0 | 0 | 0 |
| s25v-5 / s25v-2 | 128,48, 748,8 | 0 | 0 | 0 |
| s25h-5 / s25h-2 | 750,48 / 729,98, 288 | 0 | 0 | 0 |
| m390-5 / m390-2 | 117,48, 674,4 | 0 | 0 | 0 |
| m360-5 / m360-2 | 102,48, 491,5 | 0 | 0 | 0 |

- **Cómo se mide Δ:** las cajas de `.player-zone`, `.player-bar`, las cartas, el óvalo y la propia ranura, con la burbuja montada frente a la misma ranura con la burbuja en `display: none`, en el mismo instante. Antes se exige que ninguna de esas cajas tenga una animación corriendo (lección E-33): 0 animaciones en las 13.

**Puertas 3 a 7, mesa 5, cuatro casos.** Todos en ✓ y sin errores de consola.

| Caso | 3 · primer «15» (aterrizaje) | 4 · abrir → tarjeta · plegar → burbuja | 5 · a 5 s | 6 · vence | 7 · sin velo · nombre |
|---|---|---|---|---|---|
| forzosa-pc | +3 729 (+3 729) | 12 → 12 · 12 → 12 | tarjeta sola, sin «Ver la mesa» | mesa desmontada (+19,9 s) | 0 overlays · 5 caras destapadas |
| forzosa-s25v | +3 738 (+3 738) | 12 → 12 · 12 → 12 | ídem | mesa desmontada (+19,9 s) | 0 overlays · destapada |
| automática-pc | +3 734 (+3 734) | 12 → 12 · 12 → 11 | ídem | «Siguiente mano» (+19,1 s) | 0 overlays |
| automática-s25v | +3 730 (+3 730) | 12 → 12 · 12 → 12 | ídem | «Siguiente mano» (+19,9 s) | 0 overlays |

- **La red de 6 s no saltó en ningún caso** (`data-rec-red` nunca a 1). El «15» cae en el fotograma del aterrizaje, que es lo esperado: `recargaLista` pasa a verdadero en el render en que la celebración se descarga.
- **Vence** a unos 15 s del «15» más el cierre. La forzosa sale por la misma puerta que la ✕, y en la hoja se ve «Retar a las IAS».
- **La puerta 7 en S25 v** salió «sin caso» en una corrida: todas las IAS no ganadoras se habían retirado y no había nombre que destapar. Se repitió y pasó. La corrida sin caso queda anotada en `reloj.json` (`_sinCaso`).

### 2.4 Varas del anillo (§0 de la ficha)

| Celda | Diámetro | Número | Contraste del número | Contraste del trazo |
|---|---:|---|---:|---:|
| S25 v (412×915) | 34 px (≥ 32) | 14 px · 700 | 9,66 : 1 | 9,66 : 1 |
| 360×640 | 34 px | 14 px · 700 | 9,66 : 1 | 9,66 : 1 |

El fondo es translúcido (0,94). El contraste es el peor de los dos compuestos: sobre negro y sobre `#235c38`, el verde más claro del tapete.

### 2.5 Capturas (en `capturas-rec/fase1/` y en la hoja)

- **La burbuja en las 13 celdas:** `burbuja_<celda>.png`, recuadrada en azul en la hoja.
- **La tarjeta abierta con «Ver la mesa»:** `abierta_<celda>.png` (pc, S25 v, S25 h, 1366, 1280, 1024 y 360×640) y `reloj_abierta_<caso>.png`.
- **Los últimos 5 s:** `ultimos5_<caso>.png`.
- **El vencimiento:** `vence_<caso>.png`.
- **La tira del final de mano cada 250 ms**, en forzosa-pc y forzosa-s25v: `tira/`. En la hoja, el primer fotograma con burbuja lleva el marco azul.
- **Antes | después:** `tarjetas/`, con la forzosa y la automática en las cuatro de escritorio y la forzosa compacta en 915×412, 844×390 y 640×360.

---

## 3. El normativo v1.2 aplicado

- **Qué se hizo:** `docs/AJILEI_APU-1_Reglas_v1.2.md` es una copia de la v1.1 con los seis bloques de la enmienda aplicados **literalmente**. Todas las anclas existían. La v1.1 no se tocó.
- **Cuánto cambia:** `git diff --no-index` da 9 fragmentos, +43 −9:

| Fragmento | Qué |
|---|---|
| l. 1 | título: v1.1 → **v1.2** |
| l. 5 | nota de sustitución: «Sustituye a la v1.1 (2026-09-19), que se conserva como historia, y a `AJILEI_Modos_y_Asistencia_v1.0.md §3.3`…» |
| l. 7 | fecha: 2026-09-19 → **2026-09-26** |
| §5.1 | Bloque 1, sustitución entera, con la nota REC-1 |
| §5.4 | Bloque 2, sustitución entera |
| §5.5 | Bloque 3, nuevo, justo tras el §5.4 |
| §10 | Bloque 4: fila «Plazo de la pregunta» sustituida |
| §10 | Bloque 5: fila «Apertura sola de la tarjeta» añadida tras ella |
| §13 | Bloque 6: «v1.1 → v1.2 (REC-1, 2026-09-26)» al final (el §13 es el último apartado del documento) |

- **La nota de sustitución.** La línea «Base» («…La v1.0 se conserva como historia.») **no se tocó**: la enmienda solo nombra la nota de sustitución, que vive en la línea «Autoridad». Dice la verdad, pero repite lo de la v1.0. Si el rector quiere la «Base» actualizada, es una línea.
- **Una cifra de la v1.2 ya no se cumple.** El texto que la enmienda mantiene en §5.4, «En 360×640 la tarjeta mide ≤ 142,78 px», es la cifra de A2. A5 la dejó en 156,89 y ahora mide **163 px**. La vara que el arnés aplica, **0 px² sobre las cartas**, sí se cumple (con 0,53 px de holgura). Ver H-3.

**Otros documentos.**
- **Sistema de Diseño:** se añadió la nota 9 del §12, sin renumerar. Recoge:
  - el patrón «pregunta que no tapa»;
  - la variante C y su vara de legibilidad;
  - la regla de desmontar y no esconder.
- **Comentarios de código actualizados:**
  - `GameTable.jsx`:
    - el del plazo, que decía «DIEZ SEGUNDOS» y citaba una frase inexistente del §5.4 («misma pantalla, mismo plazo»), cita ahora la v1.2 §5.1 (§J-1 de la Fase 0);
    - el de `rechazarRecarga` pasa de «§5.4 · Si no recarga…» a la v1.2 §5.1.
  - `mesaCore.js`: la cabecera apunta a la v1.2, y el `pideRecarga` también (§5.4 → §5.1).
  - `apu.css`: la cabecera apunta a la v1.2.

---

## 4. Desviaciones y hallazgos

### Desviaciones

- **D-1 · La automática en vertical estrecho va sin título** (`apu.css` §12, `max-width: 480px` y vertical, solo la tarjeta que lleva `.rec-plazo-fila`).
  - **El problema:** la fila con «Ver la mesa» de 36 px (el piso táctil del §5.4) añade 22 px a una tarjeta que A5 dejó con 6,28 px de holgura en 360×640. Con título medía **179,09 px y pisaba 15,6 px de la mano**.
  - **La salida:** sin «Recargar fichas» mide **163 px**, arriba en 471,00 con las cartas acabando en 470,47, y pisa **0 px²**. Es lo que dibuja la lámina sellada, aunque ella misma se declara aproximada en letra y tamaño.
  - **Las alternativas**, todas contra alguna vara sellada:
    - bajar el botón de 36;
    - quitar aire de A5;
    - aceptar que pise la mano.
  - La voluntaria conserva el título. **Lo decide el rector** (K-2).
- **D-2 · `recargaSeg` se sigue cargando a 15 al montar la pregunta.** Lo que se retrasa es el tic: no corre hasta `recargaLista`.
  - Es equivalente a lo que pide la ficha: el primer «15» visible cae al terminar la revelación, y la puerta 3 lo mide.
  - Así el efecto de apertura no cambia de forma.
- **D-3 · La clave es `ia.recarga.vermesa`, no `ia.recarga.verMesa`.** La prueba de IDI-0 (`textos.test.js`) prohíbe mayúsculas en las claves.
- **D-4 · `position: relative` va sobre `.action-area.rec-ranura`,** no sobre toda `.player-bar .action-area` como escribe la ficha.
  - Es prudencia, no un defecto medido: la `.action-area` de las apuestas tiene hijos posicionados, y un `relative` ahí les cambiaría la caja contenedora en todas las fases.
  - La ranura reservada gana la clase `rec-ranura` en el JSX. Δ = 0 medido.
- **D-5 · El arnés `apu` cambió más de lo que dice la ficha:**
  - **`abrirRecarga`:** espera la burbuja, la toca y espera la tarjeta quieta y 450 ms. Se usa en `recargaSuave`, `recargaForzosa`, `apu.3` y `lineaAllinEnMesa4`, porque la pregunta ya no está en el DOM en t = 0.
  - **La pregunta pendiente**, por `data-rec-motivo`: la leen `APU_EN_PAGO` y `jugarHasta`.
  - **`apu.3`:** se exigía el plazo en «15 s». Ahora se exige un plazo en marcha, porque la tarjeta se abre con el tiempo que quede.
  - **`medirBotonesRecarga`:** mide hasta la fila del cronómetro y además mide «Ver la mesa», el alto de las acciones, el aire inferior y «Tu mejor palo».
  - **`VARA_BOTONES`:** la forzosa pasa a `left` y se añade la vara `compacta`.
  - **Los puntos nuevos** son `esc.blanda`, `esc.forzosa`, `tel.forzosa` y `tel.forzosa915`. 915×412 se toma redimensionando la página de 640×360, como hace `fotoS25`.
  - **`lineaAllinEnMesa4`:** el presupuesto sube de 160 a 400 iteraciones por intento.
    - La primera corrida dio rojo en `tel.linea` dos veces seguidas. Tres sondas encontraron el All-in en las iteraciones 75, 116 y 319, y la línea salió en las tres.
    - Cada blanda cuesta ahora la revelación entera antes de poder rechazarla.
    - Con 400, la celda pasó, pero **en el tercero de tres intentos**: el punto sigue justo. Es azar de las IAS, no REC-1, y se deja como aviso para quien lo toque (subir intentos o sembrar la IA).
  - **`mkdirSync` y `existsSync` pasan a importarse.** `mkdirSync` ya se usaba en `retar` y `apu` sin importarse: el `try` se tragaba el `ReferenceError`.

### Hallazgos

- **H-1 · La forzosa entre manos dejaba «Iniciar mano» vivo sin velo.** En `WAITING`, con la forzosa pendiente, la ranura reservada y «Iniciar mano» conviven. Hasta hoy los tapaba el velo de la tarjeta.
  - **Arreglado:** «Iniciar mano» lleva `!recarga`, el mismo gate que «Siguiente mano».
  - **No se reprodujo en el arnés,** porque no hay molde que siente al humano ya en forzosa.
- **H-2 · La blanda en escritorio tapa ahora el 73,6 % de la mano** al abrirse (§1.3).
- **H-3 · El §5.4 de la v1.2 conserva «≤ 142,78 px»,** cifra de A2 que A5 ya había dejado atrás (156,89). La vara real (0 px²) se cumple.
- **H-4 · Dos trampas del instrumento, documentadas en el arnés:**
  - el `display: none` que mide Δ reinicia la animación de entrada de la burbuja, así que se fotografía antes;
  - la puerta 6 esperaba sin pasar su argumento a `page.evaluate` y leía la rama de la automática. Se corrigió y se repitió la parte `reloj`.
- **H-5 · Se editó `src` (comentarios y el gate de H-1) con corridas en marcha.** El HMR de Vite recarga las páginas abiertas. Las corridas de ese tramo (`rec celdas` y `apu`) salieron sin errores de consola y las cifras coinciden con las repeticiones posteriores. Se anota por prudencia.

---

## 5. Comprobaciones finales

| Comprobación | Resultado |
|---|---|
| Pruebas | **1 006 / 1 006** en 36 archivos (13 nuevas) |
| Lint | 20 errores + 1 aviso = **la línea base**, ninguno nuevo |
| `gate` | **6/6** |
| `apu` | **7/7** con las varas nuevas (360×640 en su segunda corrida, D-5) |
| `rec` | **VERDE**: p1 ✓ · p2 ✓ · p3 ✓ · p4 ✓ · p5 ✓ · p6 ✓ · p7 ✓ · anillo ✓ |
| `luz` | **VERDE**: 20 celdas + 4 tapetes, p1–p5 y extras |
| `rev` | **VERDE**: 10 celdas, p1–p5 y oclusión |
| Build | limpio; el aviso de trozo > 500 kB es el de siempre |
| Protegidos | intactos; `gameEngine.js`, `aiPlayer.js` y `deck.js` sin abrir |
| `git status` | solo los archivos del §1.2 de la ficha, `capturas-rec/` y los residuos conocidos. `_verhoja_tmp.mjs` ya no está |

---

## 6. Preguntas al rector

- **K-1 · La blanda abierta en escritorio tapa el 73,6 % de la mano.** ¿Se acepta, porque solo ocurre al abrirla o en los últimos 5 s? ¿O se busca otra geometría para el escritorio? Por ejemplo, la tarjeta en la columna libre a la derecha de la mano, que en 1920 queda ancha.
- **K-2 · La automática sin título en 360×640 (D-1).** ¿Se sella? ¿O se prefiere otra renuncia: 2 px menos de aire, un «Ver la mesa» más bajo que el piso táctil…?
- **K-3 · ¿Se corrige la cifra «≤ 142,78 px» del §5.4 en una v1.3?** Pasaría a «≤ 163 px y 0 px² sobre las cartas».

---

## 7. Tiempo real

| Tramo | Tiempo |
|---|---|
| Normativo v1.2 y lectura | 00:32 → 00:36 (4 min) |
| Parte B, lógica, pruebas, JSX, burbuja y CSS | 00:36 → 00:45 (9 min) |
| Parte A, CSS y ajustes del modo `apu` | 00:45 → 00:57 (12 min, entrelazado con B) |
| Modo `rec`, humo y correcciones del instrumento | 00:43 → 01:15 |
| Corridas `rec`, `apu`, `gate`, `luz` y `rev`, más la depuración de `tel.linea` | 00:56 → 02:00 |
| Hoja e informe | 01:50 → 02:01 |
| **Total** | **00:32:31 → 02:01:05, 1 h 28 min** (tope: 4 h) |
