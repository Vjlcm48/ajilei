# AJILEI · Tapetes — v1.1

**Estado:** Revisión de especificación. Sustituye a `AJILEI_Tapetes_v1.0.md`, que queda como historial.
**Fecha:** 2026-08-21
**Base de código:** HEAD `25290bb` (docs/protegidos v1.0). Documento **con implementación asociada**: lo implementa la tanda **VIS-1b** de la campaña VIS, en el mismo commit.
**Naturaleza:** **Delta sobre la v1.0.** Todo lo que esta revisión no modifique explícitamente sigue vigente tal como está escrito en la v1.0: catálogo de cinco, escalera de precios (10.000 / 15.000 / 25.000 / 50.000), tricolor como "mesa vestida", vista previa en vivo con confirmación Sí/No, tres estados visuales, cambio libre entre comprados, sin descuento hasta Supabase, cosméticos fuera de la tienda de dinero real, arquitectura aditiva por `data-tapete` en hoja propia y gate de escritorio. Lo que cambia es **el color de las rampas** y **dónde vive ese color**.
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md` (regla del dorado único, intacta).
**Base de medición:** campaña **VIS-0** (fase de solo lectura) — tokens leídos vivos sobre `body` a 1920×1080 con los cinco tapetes sembrados, más prueba negativa a 375×812. Toda cifra de este documento sale de ahí o de la aritmética declarada en §2; las que no se midieron se declaran como tales.

---

## 1 · Qué cambia — el fieltro baja un escalón y el color deja de estar duplicado

La v1.0 §2 selló la dirección con una regla exacta: *«los cuatro tapetes nuevos parten de la misma profundidad tonal del verde abisal actual»*, y EMB-2 la implementó como **misma L y misma S, sólo cambia H**. La medición de VIS-0 confirmó que la implementación cumplía la regla al pie de la letra. El checkpoint visual de Victor sobre tablero de muestras concluyó que **la regla se cumplía y aun así el fieltro salía claro**: la escalera heredada era la del verde de siempre, y ese verde nunca se había calibrado — se había heredado.

| | v1.0 (EMB-2) | **v1.1 (VIS-1b)** |
|---|---|---|
| Regla de derivación | Misma L y S del verde; sólo cambia H | **Misma ESCALERA de L, multiplicada por un factor `k` propio de cada familia** |
| Verde clásico | Heredado, sin calibrar | **Calibrado** (`k` = 0,78): baja un escalón entero |
| Alcance del verde | Escritorio y móvil, por ser un token compartido | **Igual — y ahora es decisión explícita** (§3) |
| Saturación del vinotinto | La del verde, «ni un punto más» | **64%**, con H 344 (era 45% y H 348) |
| Color del disco del menú ⋮ | Hex en `src/config/tapetes.js`, pintado inline | **Token `--tap-swatch-<id>` en `tapetes.css`**; el catálogo guarda el nombre |
| Tricolor | Sellado | **Sin cambios** — queda en v1.0, pendiente de revisión de Victor |
| Geometría, cajas, precios, UX | — | **Δ=0.** Esta revisión no toca una sola propiedad de caja |

### 1.1 La doctrina de "misma L, sólo cambia H" — ENMENDADA, con contabilidad

No se archiva: se generaliza. La v1.0 §2 pedía **profundidad equivalente**, y eso sigue siendo la regla; lo que se enmienda es su implementación aritmética, que confundía «equivalente entre los cinco» con «idéntica a la del verde de partida». La escalera de proporciones de v1.0 (L 7,8 · 9,6 · 19,6 · 24,9 · 32,0) **se conserva íntegra** — es lo que hace que los cinco sean el mismo fieltro en cinco colores. Lo que entra es un factor de escala por familia, porque la percepción de profundidad no es lineal con la L de HSL: un gris a la L de un verde lee como cemento y un burdeos a esa misma L lee como marrón.

---

## 2 · Valores sellados

Cinco paradas por familia, más las tres tintas derivadas. **Los alfas no se mueven** (0,88 · 0,45 · 0,30): fijan cuánta mesa se ve a través de cada zona, que es geometría de lectura y no color.

| id | abyss | darkest | deep | base | bright | `--surface-game` (base @ .88) | `--surface-area` (abyss @ .45 / .30) |
|---|---|---|---|---|---|---|---|
| **verde** (`theme.css`) | `#09170e` | `#0b1c11` | `#153922` | `#1b482c` | `#235c38` | `rgba(27, 72, 44, .88)` | `rgba(9, 23, 14, .45)` / `.30` |
| **grafito** (`tapetes.css`) | `#0d0d0f` | `#0f1012` | `#202224` | `#282b2e` | `#34373b` | `rgba(40, 43, 46, .88)` | `rgba(13, 13, 15, .45)` / `.30` |
| **azul** (`tapetes.css`) | `#090f17` | `#0b121c` | `#152539` | `#1b2f48` | `#233c5c` | `rgba(27, 47, 72, .88)` | `rgba(9, 15, 23, .45)` / `.30` |
| **vinotinto** (`tapetes.css`) | `#1b080d` | `#210910` | `#470f1e` | `#5a1426` | `#731931` | `rgba(90, 20, 38, .88)` | `rgba(27, 8, 13, .45)` / `.30` |
| **tricolor** | sin cambios — v1.0 íntegra | | | | | | |

**Muestras elegidas por Victor en tablero:** Verde clásico **B** · Negro grafito **A** · Azul profundo **B** · Vinotinto **B**.

### 2.1 Regla de derivación

Las rampas conservan la escalera de luminosidad de v1.0 (**L 7,8 · 9,6 · 19,6 · 24,9 · 32,0 %**) multiplicada por un factor `k`:

| familia | `k` | H | S | nota |
|---|---|---|---|---|
| verde | **0,78** | 142 | ≈ 45% | el `bright` nuevo (`#235c38`) **es** el `base` de v1.0: la escalera se corrió una parada entera hacia lo hondo |
| azul | **0,78** | 214 | ≈ 45% | comparte `k` con el verde — misma profundidad, dos matices |
| grafito | **0,68** | — | ≈ 7% | el más hondo de los cinco. Su H es ruido de cuantización: a S≈7% y 8 bits, un solo nivel de rgb mueve el matiz decenas de grados. El dato que manda es S |
| vinotinto | **0,86** | 344 | ≈ 64% | el único que gana saturación y el único con `k` > 0,8 |
| tricolor | — | — | — | v1.0 íntegra |

**Vinotinto — referente sellado (Victor):** la **camiseta local 2026 de la selección** — burdeos intenso con detalles en oro. Es el único de los cinco con un referente externo, y por eso es el único que se sale de la banda de saturación de la familia. La regla del dorado único no se toca: el oro de la camiseta es el `--gold-brand` que la app ya tiene.

**Consecuencia registrada:** la v1.0 §2 describía el tricolor como «la familia AZUL al 85% de su saturación». Al quedar el tricolor en v1.0 y bajar el azul a `k` = 0,78, esa relación **ya no se sostiene numéricamente**. Se deja escrita en el código como registro de lo que esas cifras querían decir, y se resuelve cuando Victor revise el tricolor.

---

## 3 · Un solo verde en todo el producto

**Decisión de Victor, explícita:** el verde es **un solo token compartido**. `--green-*` vive en `theme.css` `:root` y móvil lo consume tal cual, porque `data-tapete` **nunca** se aplica fuera del gate de escritorio (`useTapetes` + la media query de `tapetes.css`, doble cinturón verificado con prueba negativa en VIS-0: a 375×812 con `tricolor` sembrado en disco, `body.dataset.tapete` es `null`).

Por tanto: **ningún archivo móvil cambia y el render móvil sí cambia.** Es una excepción deliberada al Δ=0 de la tanda, no un efecto colateral. Un segundo verde "de móvil" sería una segunda fuente de color y la v1.1 va exactamente en la dirección contraria.

---

## 4 · Fuente única de color — los discos del menú ⋮

VIS-0 midió el panel y encontró **dos copias del mismo color**: el hex de `src/config/tapetes.js` (pintado inline por `TapetesPanel.jsx`) y el token de `tapetes.css`. Coincidían por disciplina, no por construcción. Con las rampas nuevas, mover una y olvidar la otra dejaría el disco mintiendo sobre el fieltro que promete.

Desde v1.1:

- **`tapetes.css` §0** declara los cinco tokens `--tap-swatch-<id>` en `:root`, **fuera de la media query** — son dato, no estilo gateado. Cada uno vale el `--green-base` de su familia; el del tricolor es el degradado de tres paradas, movido verbatim desde el catálogo.
- **`src/config/tapetes.js`** guarda en `swatch` el **nombre del token** (`'--tap-swatch-azul'`). **Prohibido cualquier hex de tapete en JS.**
- **`TapetesPanel.jsx`** pinta `background: var(<token>)`. La caja y el filete del disco (`tapetes.css`, `.tap-disco`) **no se tocan**: 46×46 px medidos, idénticos antes y después.

Los cinco tokens van como literal y no como `var(--green-base)` porque tienen que convivir en el **mismo** elemento, y `--green-base` sólo vale uno a la vez. Queda por tanto un espejo declarado entre `theme.css` y `tapetes.css §0` para el verde: se registra aquí en vez de esconderse.

---

## 5 · Fuera de alcance de esta revisión

Tricolor (valores) · barrido dorado sobre el isotipo · cualquier propiedad de caja · activos (Heptacoin y reverso: VIS-2 y VIS-5) · vuelo de monedas (VIS-3) · archivos protegidos · la escalera sellada dentro del arnés.

**Deuda declarada en VIS-1b — RESUELTA en VIS-1c.** `scripts/diagDSK.mjs` guardaba la escalera del verde de v1.0 como constante (`TAP_ESCALERA_VERDE`, tolerancia `TAP_TOL_L` = 1,0) y comparaba cada rampa contra ella: en cuanto v1.1 calibró las cinco, el modo `tapetes` se volvía un falso rojo sobre todas. La constante **desaparece**. El arnés ya no guarda un solo color: guarda **relaciones**, y las lee enteras de tokens vivos.

**El contrato de color v1.1 — cinco puertas, ningún hex dentro del arnés:**

| # | puerta | qué exige |
|---|---|---|
| 1 | Escalera monótona | `L(abyss) < L(darkest) < L(deep) < L(base) < L(bright)`, leído de los cinco tokens computados en `body`. Es lo que "profundidad" significa sin nombrar un valor |
| 2 | Superficies derivadas | `--surface-game` = rgb(`base`) al alfa de hoy; `--surface-area` y su variante ligera = rgb(`abyss`) a los suyos. Tolerancia ±1 por canal (redondeo a 8 bits). **Los alfas siguen intocables** |
| 3 | Familia de matiz | las cinco paradas dentro de **±8°** del matiz del `base` — un tapete es un color en cinco profundidades, no cinco colores. **Se omite** cuando `S(base) < 12%`, porque ahí el matiz es ruido de cuantización (grafito) |
| 4 | Swatch = base | el disco del menú ⋮ computa el `--green-base` de su tapete. Es la puerta que prueba que la fuente única de color de §4 no se rompió. El tricolor, que no tiene tono medio, exige que su degradado **contenga sus tres tintas** |
| 5 | Default = raíz | con el verde puesto —y fuera del gate, en móvil—, los ocho tokens de `body` son los de `:root`. El verde no existe como regla, y ahora eso se **prueba** en vez de compararse contra una copia |

La envolvente de L de las tres bandas del tricolor se reancla a **su propia** escalera (antes se medía contra la del verde, que desde v1.1 es otra familia y otra profundidad). Las puertas de geometría (Δ=0 sobre 18 anclas, constante del camino de render, panel fuera de flujo) y el flujo de compra **no cambian**.

El modo **imprime lo medido tapete por tapete** —las cinco L, el matiz del base con su dispersión, el `base`, la tinta derivada y el color del disco— para que un verde se pueda leer y no sólo creer. Victor puede recalibrar los cinco tapetes sin tocar una línea del arnés, que es exactamente lo que no pasó esta vez.

---

## 6 · Historial

- **v1.1 · apéndice VIS-1c** — 2026-08-21. Cierre de la tanda. (a) Las **tres superficies de cromo** de `theme.css` —`--surface-card`, `--surface-panel`, `--surface-modal`— se rederivan con el mismo parentesco que tenían con la rampa v1.0, porque se habían quedado con el rgb de la familia vieja y el lobby salía con el fondo un escalón más hondo que sus tarjetas: `rgba(9,23,14,.55)` · `rgba(9,21,13,.75)` · `#0c1d13`. Siguen sin heredar tapete: no son fieltro. (b) El modo `tapetes` del arnés pasa al **contrato de color v1.1** descrito en §5 y la constante `TAP_ESCALERA_VERDE` desaparece. (c) `scripts/screenshots/` entra en `.gitignore`, con el criterio de `capturas-dsk/`.
- **v1.1** — 2026-08-21. Enmienda de color de la campaña **VIS**. Las cinco rampas se calibraron sobre lo medido en VIS-0 y se sellaron en tablero de muestras: Verde clásico B, Negro grafito A, Azul profundo B, Vinotinto B; **Tricolor queda en v1.0**, pendiente de revisión de Victor. La regla de derivación pasa de «misma L del verde» a «misma escalera de L × factor `k` por familia» (§2.1) — el verde deja de ser heredado y pasa a estar calibrado. **Un solo verde en todo el producto:** el token es compartido con móvil y el cambio alcanza a móvil por construcción (§3). **Fuente única de color:** los swatches del menú ⋮ leen los tokens `--tap-swatch-<id>` de `tapetes.css`; `config/tapetes.js` sólo guarda el nombre del token (§4). Vinotinto toma como referencia la camiseta local 2026 de la selección (burdeos intenso con detalles en oro). Implementado en el commit **VIS-1b**.
- **v1.0 (15-ago-2026):** documento fundacional. Decisiones selladas por Victor en sesión: catálogo de 5, escalera de precios, tricolor como "mesa vestida", vista previa en vivo con confirmación Sí/No, tres estados visuales, cambio libre entre comprados, sin descuento hasta Supabase, cosméticos fuera de la tienda de dinero real. Procedencia: lienzos concebidos el 5-ago (catálogo de tienda) y 11-ago (proyección económica: doctrina del sumidero + resolución del dorado único); direcciones de color propuestas el 15-ago y decididas por Victor en esta fecha. Implementado en la tanda **EMB-2**.
