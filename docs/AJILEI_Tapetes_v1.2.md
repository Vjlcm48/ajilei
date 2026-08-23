# AJILEI · Tapetes — v1.2

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Tapetes_v1.1.md`, que queda como historial.
**Fecha:** 2026-08-23
**Base de código:** HEAD `4b42496` (MOV-1b-f). Documento **posterior a la implementación**: recoge lo que la tanda **MOV-1b-a** ya selló y midió.
**Naturaleza:** **Delta sobre la v1.1.** Todo lo que esta revisión no modifique explícitamente sigue vigente tal como está escrito en la v1.1 y, a través de ella, en la v1.0: catálogo de cinco, escalera de precios, tricolor como "mesa vestida", vista previa en vivo con confirmación Sí/No, tres estados visuales, cambio libre entre comprados, sin descuento hasta Supabase, cosméticos fuera de la tienda de dinero real, las cinco rampas calibradas con su factor `k`, la fuente única de color de los discos y el contrato de color de cinco puertas del arnés. **Lo que cambia es dónde se puede elegir un tapete: la función deja de ser de escritorio.**
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md` (regla del dorado único, intacta).
**Documento hermano:** `AJILEI_Menu_Utilidades_v1.5.md` — el panel de Tapetes es uno de los cuatro **satélites del ⋮** que allí se sellan (doctrina **D6**).
**Base de medición:** campaña **MOV**, tanda **MOV-1b-a** — modo `menu-movil` del arnés, **16 celdas** (4 mesas × 4 viewports) más contra-celda de escritorio 1920×1080. Toda cifra sale de ahí.

---

## 1 · Qué cambia — el fieltro se elige también en el teléfono

Hasta la v1.1, elegir tapete era una función de escritorio con **doble cinturón**: `useTapetes` sólo corría dentro del gate, y aunque hubiera corrido, todo `tapetes.css` vivía dentro de la media query de escritorio.

| | v1.1 | **v1.2 (MOV-1b-a)** |
|---|---|---|
| Dónde se elige | Sólo escritorio | **Las dos ramas** |
| `data-tapete` en `body` | Nunca fuera del gate | **También en móvil**, mientras la mesa vive |
| Hoja `tapetes.css` | Entera dentro de la media query de escritorio | **Global** |
| Disposición del panel | Rejilla 3×2 | **Igual en vertical; fila de 5 en horizontal** (§2) |
| Colocación del panel | Anclado al ⋮ | **D6** — satélite con pinza al techo derivado |
| Catálogo, precios, previa, compra | — | **Δ=0.** Ni una decisión de producto cambia |

### 1.1 El segundo cinturón — RETIRADO, con contabilidad

**Lo que era.** Las redefiniciones de token de `tapetes.css` vivían gateadas a escritorio, de modo que en móvil el fieltro salía verde **aunque el `localStorage` trajera un tricolor**. La v1.1 §3 lo describía como «doble cinturón verificado con prueba negativa».

**Por qué se retira.** Ese cinturón era correcto mientras Tapetes fuera una función de escritorio. Encendida en móvil con autorización de Victor, se vuelve **justo lo contrario de un guardarraíl**: dejaría al jugador elegir un tapete, pagarlo, persistirlo y **no ver nada**. Un sello que sobrevive a su motivo no protege, estorba.

**Por qué GLOBAL y no una segunda copia bajo el complemento.** Lo que hay en esa hoja son **redefiniciones de token** sobre `body[data-tapete=…]` más la piel de una superficie que ahora existe en las dos ramas. Duplicarlas sería una tercera piel que mantener a mano, y la deuda de dos ya está declarada en `menuMovil.css` (`AJILEI_Menu_Utilidades_v1.5.md` §7.3). Mismo criterio que la v1.1 §4 aplicó a los discos: **son dato, no estilo gateado**.

**Δ=0 en escritorio por construcción** —las reglas siguen aplicando allí igual— y Δ=0 en móvil hasta que el panel se monta: ninguno de esos selectores existía en el árbol móvil.

### 1.2 Corrección de la v1.1 §3 — el enunciado sigue, la razón cambia

La v1.1 §3 sostenía «un solo verde en todo el producto» apoyándose en que `data-tapete` **nunca** se aplica fuera del gate de escritorio. **Esa premisa ya no es cierta**, y se corrige aquí para que el documento no mienta.

**La conclusión no cambia, y ahora se sostiene mejor:** el verde sigue siendo **un solo token compartido**, porque **el verde no existe como regla** — es la ausencia de atributo, tal como sella la §0 de la hoja. Medido a los dos lados del cambio, en mesa 5 a 360×640 con Verde clásico sembrado explícitamente:

| token | antes (`ce979ac`) | después | |
|---|---|---|---|
| `--green-base` | `#1b482c` | `#1b482c` | = |
| `--green-abyss` | `#09170e` | `#09170e` | = |
| `--green-deep` | `#153922` | `#153922` | = |

Testigos de refuerzo, también idénticos: `.game-table` resuelve `rgba(27, 72, 44, .88)` y `.game-table-screen` queda transparente. La única diferencia es de atributo y no de color: antes `body` no llevaba `data-tapete` y ahora lleva `data-tapete="verde"`, que **no tiene ninguna regla asociada**.

**Consecuencia registrada en el arnés (regla ARN-1: quien mueve la ruta, recablea el metro).** La prueba **negativa** del modo `tapetes` medía justo ese cinturón —exigía verde en móvil con un tricolor sembrado— y se recableó en la misma tanda: ahora exige que el tapete sembrado **pinte**. Verificado corriendo el modo entero: en las dos celdas móviles con `tricolor` sembrado el atributo llega a `body` y `--green-base` resuelve a `#273c58` en vez de al verde de `:root`.

---

## 2 · La disposición en horizontal — fila de cinco

En vertical el panel no necesita ni una regla propia: la rejilla 3×2 mide **250 × 270,98** y cabe en 375×812 y en 360×640 bajo la pinza de D6.

En horizontal no cabe, y está medido: la banda libre bajo el techo derivado son **~191 px** a 640×360 y **~203** a 812×375, contra los **271** de la rejilla. Faltaban 80.

**La fila de cinco, y es un solo token.** `--tap-cols: 5` ya gobierna la rejilla **y** el ancho del panel, que es un `calc()` derivado de él. **Ninguna caja nueva y ningún `data-layout`** — mismo criterio que el selector de reacciones de `AJILEI_Menu_Utilidades_v1.5.md` §5.

| | vertical | **horizontal** |
|---|---|---|
| `--tap-cols` | 3 | **5** |
| Caja del panel | 250 × 270,98 | **406 × 161,59** |
| Holgura bajo el techo derivado | amplia | **29 px** en la celda peor |
| Colocación | D6, bajo el ⋮ | D6, a 6 px a su izquierda, `top` 8 |

Ancho derivado: 5·72 + 4·6 + 22 = **406**, holgado bajo el tope de `innerWidth − 16` (624 en la celda más estrecha). El título se queda encima: es lo que deja la fila más baja.

**Las cinco fichas conservan tamaño, previsualización y reversión** — no se toca ni una.

---

## 3 · Las fichas de fieltro en táctil

| | medida |
|---|---|
| Hit real de cada ficha (`elementFromPoint`) | **73 × 109** en 14 celdas · **72 × 109** en mesa 2 horizontal |
| Estándar de campaña | 44 |

Muy por encima de 44 en los dos ejes, así que **no queda deuda táctil que reportar**. En la fila horizontal —que esta tanda estrena— el ≥44 es **puerta**: estrenar una disposición por debajo del estándar sería crear la deuda a mano.

**Flujo verificado en las 16 celdas:** el panel abre desde su entrada del ⋮ (que cierra al ejecutar, así que el panel de utilidades ya se desmontó cuando éste se pinta), las cinco fichas están presentes, **elegir un fieltro no comprado pinta la mesa en el acto** (verde → grafito) y el tap fuera **cierra y revierte** (→ verde). La mesa es el probador: la previa es en vivo y la compra se confirma aparte, como sella la v1.0.

---

## 4 · Fuera de alcance de esta revisión

Valores de color (los cinco `k`, las rampas y el tricolor siguen en v1.1 y v1.0) · tricolor pendiente de la revisión de Victor · precios y catálogo · la tienda · cualquier propiedad de caja de las fichas y los discos · archivos protegidos.

---

## 5 · Historial

- **v1.2** — 2026-08-23. **El fieltro se elige también en el teléfono.** Tanda **MOV-1b-a** de la campaña MOV. El **segundo cinturón se retira** y `tapetes.css` pasa a global, con Δ=0 en escritorio por construcción (§1.1); la v1.1 §3 se corrige en su premisa —`data-tapete` sí llega a móvil— **conservando su conclusión**, ahora apoyada en que el verde no existe como regla, con los tres tokens medidos idénticos a los dos lados del cambio (§1.2). En horizontal el panel pasa a **fila de cinco por un solo token** (`--tap-cols: 5`, 406 × 161,59), sin caja nueva ni atributo de disposición (§2); en vertical la rejilla 3×2 se conserva. Colocación por **D6** en las 16 celdas. **Hit de ficha 72–73 × 109**, muy por encima del estándar táctil, que en la fila nueva es puerta (§3). La prueba negativa del modo `tapetes` se recablea en la misma tanda: de exigir verde en móvil a exigir que el tapete sembrado **pinte**.
- **v1.1 · apéndice VIS-1c** — 2026-08-21. Las tres superficies de cromo de `theme.css` se rederivan; el modo `tapetes` pasa al contrato de color v1.1 y `TAP_ESCALERA_VERDE` desaparece; `scripts/screenshots/` entra en `.gitignore`.
- **v1.1** — 2026-08-21. Enmienda de color de la campaña **VIS**. Cinco rampas calibradas con factor `k` por familia, muestras selladas en tablero, tricolor en v1.0, un solo verde compartido y fuente única de color para los discos del menú ⋮. Implementado en el commit **VIS-1b**.
- **v1.0 (15-ago-2026):** documento fundacional. Catálogo de 5, escalera de precios, tricolor como "mesa vestida", vista previa en vivo con confirmación Sí/No, tres estados visuales, cambio libre entre comprados, sin descuento hasta Supabase, cosméticos fuera de la tienda de dinero real. Implementado en la tanda **EMB-2**.
