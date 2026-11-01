# AJILEI · TIE-1 · Fase 1a-L · Informe de la lámina · v1.0

**Ficha:** `AJILEI_TIE-1_Fase1aL_Lamina_v1.0.md` · **Base:** `main` en `2a9857e`, árbol limpio salvo lo de MOT-1 · **Fecha:** 2026-10-31 · **Estado:** STOP-L, sin commits.

## §0 · Resumen

| | |
|---|---|
| **Lámina** | `laminas/tie1a/` (fuera de git). 13 vistas + V0 (lobby de hoy) + la tira de tonos. **113 capturas** en los seis tamaños, 6 hojas «antes/después» del lobby y la tira. |
| **Vitrina** | Componente propio, sin `GameTable` ni `gameTable.css`. **Δ = 0** entre los 8 tokens que lee la vitrina y los que lee la mesa, en los **11 casos** (5 tapetes, 9 tonos). Los tokens y la luz de LUZ-1 no se copian: se leen de `tapetes.css` y `luz.css` y se cambia el selector. |
| **Tonos** | Propuesta: **L de HSL × 1,24 (claro) y × 0,80 (oscuro)** sobre cada parada del tono de hoy; H y S intactos. ΔL* entre vecinos **4,2–5,5**; ΔY **+48…+54 % / −32…−35 %**. Ningún tono baja del contraste que **el verde de hoy** ya tiene. |
| **Hallazgos** | (1) **«Tienda» ya existe** en la barra inferior del lobby (LOB-1), en oro de tinta, y hoy dice «Pronto». (2) «Conseguir más monedas» **no es una pantalla**: es la hoja `HojaMonedas` («Conseguir monedas») que cuelga del «+». (3) **No hay `PANEL_H`**: la cifra es `altoPanel(filas) = filas×44+24`. (4) La banda de dos columnas de `salas.css` atrapa a la tienda en 1366×768 y en el S25 acostado. |
| **Recomiendo** | **V1-A** (icono A) · **V2-B** · **V3-A** · **V4-A** con muestras redondas · **V5-A** · **V6** entre Sonido e Idioma · **V7**: 200 / 156. Igual que el rector en todo; en V1 con datos más fuertes de lo previsto. |

---

## §1 · Cómo se sirve y cómo se usa

Mismo procedimiento que la 1b-L de CFG-1 (`laminas/cfg1b/` ya no existe, pero su informe deja la receta: vite dev en el 5174 con `--host`, una raíz propia que monta las pantallas reales, `capturar.mjs` con playwright-core y Edge).

```
npx vite --port 5174 --strictPort --host 0.0.0.0      (en la raíz; ya hay uno levantado)
node laminas/tie1a/capturar.mjs [filtro]              (capturas y medidas; unos 3 min)
node laminas/tie1a/tonos.mjs                          (rehace tonos.css y tonos.json)
node laminas/tie1a/resumen.mjs                        (las tablas de §5 desde medidas.json)
```

- **PC:** <http://localhost:5174/laminas/tie1a/lamina.html> — selector de vista, tamaño («los seis» o uno), tapete, tono, selector de tono, icono, saldo, estado de la ventana, sitio de la fila del ⚙ y estante de apertura. Enlace «abrir a tamaño real».
- **S25 (misma red):** `http://192.168.12.171:5174/laminas/tie1a/pantalla.html?vista=V4A&tapete=vinotinto&tono=claro` (cambiar `vista`, `tapete`, `tono`). Para los nueve tonos de un tirón en el teléfono: `…/pantalla.html?vista=TIRA`.
- **Parámetros de `pantalla.html`:** `vista=V0|V1A|V1B|V1C|V2A|V2B|V3A|V3B|V4A|V4B|V5A|V5B|V6|V7|TIRA` · `tapete` · `tono` · `selector=redondas|pestanas` · `ico=A|B` · `saldo` · `uso` y `uso_tono` (el tapete en uso) · `comprados` · `estado=confirmar|comprando|error|listo` · `fila=arriba|medio|abajo` · `estante=monedas|tapetes`.
- Las **marcas magenta discontinuas** señalan las puertas: el «+» (→ Monedas), «Tienda» (→ Tapetes) y la fila del ⚙ (→ Tapetes). No miden ni mueven nada (`outline`).

| Archivo | Qué es | Iría en la 1a a… |
|---|---|---|
| `vitrina.jsx` | La vitrina: fondo, mesa, asientos (V4-A), óvalo, tres cartas reales, pozo y fichas. | `src/components/Vitrina.jsx` |
| `tienda.jsx` | La pantalla: estantes, lista, vitrina, selector de tono, ventana de compra. Carcasa **real** `PantallaChips`. | `src/screens/Tienda.jsx` |
| `tie1a.css` | §1 vitrina · §2 tienda · §3 lobby (sólo B/C) · §4 fila del ⚙ · §Z sólo lámina. | `vitrina.css`, `tienda.css`, `hojaConfiguracion.css` |
| `tonos.css` / `tonos.json` / `tonos.mjs` | Los seis tonos nuevos (generados) y sus medidas. | `tapetes.css` §1 |
| `textos.js` | Los textos `tie.*`. | `textos.es.js` |
| `app.jsx` | La raíz: monta `Lobby` y la tienda reales, inyecta en el DOM lo que la 1a haría en JSX (V1, V6), dibuja V7 y la tira. **Inyecta** `tapetes.css` y los bloques de `luz.css` con el selector cambiado (§3.2). | — |
| `medir.js`, `capturar.mjs`, `resumen.mjs`, `hoja.mjs`, `pre.js`, `pantalla.html`, `lamina.html` | Medidor, capturador, tablas, hojas de contacto, arranque, página y visor. | — |
| `_sonda.mjs`, `_factor.mjs` | Sondas de diagnóstico que quedaron: **`rm` está denegado**. Se pueden borrar. | — |

---

## §2 · Bloque R (reconocimiento)

**R-1 · Dónde viven los tapetes (§K de la Fase 0 de CFG-1, confirmado hoy).** `config/tapetes.js` (catálogo: `id`, `nombre`, `descripcion`, `precio`, `swatch`; claves `ajilei.tapete` y `ajilei.tapetes.comprados`); `hooks/useTapetes.js` (pone `data-tapete` en `<body>` sólo mientras la mesa vive; compra local con `tapetesCore`); `components/TapetesPanel.jsx` (el panel del ⋮, con su diálogo de compra); `styles/tapetes.css` (global, **no protegida**). El modo `tapetes` del arnés: R-7.

**R-2 · Los 8 tokens.** `--green-abyss`, `--green-darkest`, `--green-deep`, `--green-base`, `--green-bright`, `--surface-game` (= base al 0,88), `--surface-area` y `--surface-area-light` (= abyss al 0,45 y 0,30). Declarados en `body[data-tapete="x"]` (`tapetes.css`); el verde es `:root` (`theme.css:42-74`), sin regla. Dónde pinta cada uno: fondo de `.game-table-screen` = radial base→deep→darkest (`gameTable.css:11`); mesa `.game-table` = `--surface-game` (`:25`) + la luz cenital de LUZ-1 (`luz.css`); óvalo `.center-zone` = radial bright→base→deep (`:111`) + reflejos y riel de LUZ-1; asientos y pozo = las dos tintas. El tricolor además sustituye `background` de mesa y fondo por especificidad (bandas `--tap-tri-*`). **La lámina no copia ni un valor**: inyecta `tapetes.css` cambiando `body[data-tapete="x"] {` por `.vit[data-tapete="x"] {`, así que el tono «actual» es el de hoy **por construcción**, y `medir` lo comprueba (Δ = 0).

**R-3 · «Conseguir más monedas».** No es una pantalla ni un `screen` de `App.jsx`. Es la **hoja** `components/HojaMonedas.jsx`, título «Conseguir monedas» (`video.hoja.titulo`), montada por `MarcoVideo` en un portal y abierta por el «+» de `BarraSuperior` mediante el contexto del video (`useVideo().abrirHoja`). Contenido: la fila «Ver un video» (contador «Te quedan N de 8 hoy», premio «+500 HC») y «Paquetes de monedas · Pronto». La burbuja de REC-1 (`BurbujaRecarga`) está en la mesa y no abre esta hoja. El texto «Conseguir más monedas» existió en Retar y **se retiró en ECO-1g** (`ia.retar.saldo.cta`). En la lámina, el estante «Monedas» enseña esas dos filas **con las mismas clases `vid-*` y los mismos textos**.

**R-4 · El lobby (V0, medido).** Arriba: perfil · píldora (moneda, ojito, cifra, «+») · ⚙. Centro: isotipo · «Jugar contra las IAS» · «Jugar contra jugadores». Abajo, `lob-nav` en rejilla de 3: **Rankings · Tienda · Cómo se juega**. La **Tienda ya está**, al centro, única en oro de tinta (`lobby.css:547`), con `IconoTienda` (un toldo) y `onClick={pronto}`. Cajas (x,y w×h, px CSS):

| tamaño | perfil | píldora | «+» | ⚙ | IAS | jugadores | Rankings | Tienda | Cómo se juega |
|---|---|---|---|---|---|---|---|---|---|
| 1920×1080 | 342,21 172×64 | 526,29 201×49 | 690,38 31×31 | 1526,27 52×52 | 768,645 384×66 | 768,730 384×66 | 600,983 240×76 | 840,983 240×76 | 1080,983 240×76 |
| 1366×768 | 65,21 172×64 | 249,29 201×49 | 413,38 31×31 | 1249,27 52×52 | 491,490 384×66 | 491,575 384×66 | 323,674 240×73 | 563,674 240×73 | 803,674 240×73 |
| 390×844 | 14,14 103×42 | 124,18 132×32 | 231,25 20×20 | 342,18 34×34 | 70,486 250×44 | 70,542 250×44 | 14,775 121×56 | 135,775 121×56 | 255,775 121×56 |
| 360×640 | 13,13 94×39 | 114,16 122×32 | 213,23 18×18 | 316,16 31×31 | 65,333 230×44 | 65,384 230×44 | 13,574 112×53 | 124,574 112×53 | 236,574 112×53 |
| 412×915 (S25) | 14,14 109×44 | 131,19 139×34 | 244,26 21×21 | 362,19 36×36 | 74,526 264×45 | 74,585 264×45 | 14,843 128×57 | 142,843 128×57 | 270,843 128×57 |
| 915×412 (S25) | 33,14 118×44 | 159,19 139×34 | 272,26 21×21 | 846,19 36×36 | 428,146 264×44 | 428,198 264×44 | 210,340 165×57 | 375,340 165×57 | 540,340 165×57 |

(El «+» y el ⚙ dan 44 de zona por su `::after` de PAN-1; el barrido lo confirma: §5.)

**R-5 · La hoja del ⚙ (`HojaConfiguracion.jsx`).** Hoy no hay fila de tapetes. Orden: cabecera de la cuenta (tocable → perfil, con «›») · Sonido (pastilla Sí/No) · Idioma (Español · Pronto) · Enviar sugerencia (›) · Cerrar sesión · Acerca de (›) · Eliminar cuenta. Patrón de fila: `.lob-fila` (flex, `min-height: 44px`) con `.lob-chev` «›». La cabecera fija y el cuerpo `.cfg-hoja-cuerpo` desplazable.

**R-6 · El ⋮ de la mesa.** **No existe `PANEL_H`.** La cifra vive en `config/menuEntradas.js:86`: `altoPanel(filas) = filas × 44 + 24`, y la consume `useUtilitiesMenu` (pinza) vía `filasDelPanel(contraIAS)`. Hoy: IAS 5 filas = **244**; humanos 4 = **200**. Con «Tapetes» fuera: **IAS 4 = 200 · humanos 3 = 156**. Lo que la 1a toca: `ENTRADA.TAPETES` sale de `VIVAS_ESCRITORIO`, `VIVAS_MOVIL` y `ENTRADAS_PANEL`; la fila de `UtilitiesMenu.jsx`; `partidaRapida.test.js:97-100` (5/4/244/200 → 4/3/200/156). El ancho, 64, no cambia.

**R-7 · El modo `tapetes` y quién entra por el ⋮.** Tres puntos de `scripts/diagDSK.mjs` pulsan `.util-item-tapetes`: `runMenuMovil`/u1 (~`:7976`, el bloque MOV-1b-a «Tapetes»), `runMSG` (~`:11504`, siembra el tricolor por el panel) y `runTapetes` (`:12075`; abre el panel en `:11935`). `runTapetes` mide Δ = 0 en vivo (mesas 5 y 2 × 1920×937 y 1024×768, 18 anclas, contrato de color con `tapJuzgaBanda`), la compra (2 páginas), el móvil con tricolor sembrado y 20 capturas; ~190 s. `scripts/cfg/menu1e.mjs` deriva las filas de `menuEntradas.js` y se pondrá al día solo. **«Quien mueve la ruta, recablea el metro»:** la 1a tiene que entrar por la tienda (o sembrar `inventario` + tapete en uso) en los tres, y añadir a `runTapetes` la puerta vitrina ↔ mesa por tono (la sonda de `medir.js` es el molde: misma página, `body` y una `.vit` con los dos atributos, 8 tokens, Δ = 0).

---

## §3 · Las vistas

### 3.1 · V1 · la puerta en el lobby

| | V1-A · encender la que existe | V1-B · fila bajo los CTA | V1-C · junto a la píldora |
|---|---|---|---|
| **Δ de LOB-1** | **0 en los seis tamaños** | isotipo, IAS y jugadores suben **25,6–42,6 px** (todos los tamaños; en acostado sólo los CTA, 26,1) | píldora, «+» y ojito a la izquierda **85–98 px**; el perfil pierde **85–98 px** de ancho; ⚙ +3,3–3,6; en 360 y 390 todo baja 1,1–2,8 |
| **≥ 44** | sí (121–240 × 53–76) | sí, salvo **1366×768: barrido 40,6** | el perfil cae a **33,6** (360), **36,3** (390), **38,3** (S25) |
| **Solapes** | ninguno | **1366×768: pisa la barra inferior 9,7 px** (Rankings, Tienda, Cómo se juega) | 360: «+» y «Tienda» comparten 1,4 px |
| **360×640** | sin desplazamiento | sin desplazamiento | sin desplazamiento, pero la píldora monta sobre el avatar y el nombre desaparece |
| **Además** | — | **dos puertas «Tienda»** en la misma pantalla (la barra no se quita sin mover Rankings y Cómo se juega) | — |

**Icono.** A = el toldo de hoy (`IconoTienda`). B = bolsa de línea con la Heptacoin «Grabada» dentro (el activo en `<img>`, sin recolorear; el trazo en `currentColor`, oro de tinta: INV-08 se cumple, no hay oro macizo). En la barra el B se lee más pequeño (la moneda ocupa el 44 % de un `--ico` de 18–36 px) y se confunde con la moneda de la píldora; el A es distinto de todo lo demás de la pantalla. **Recomiendo A.** Hojas: `capturas/V1_antes-despues_{tamaño}.png`, `V1A-icoB_*.png`.

### 3.2 · V2 · la pantalla

Carcasa `PantallaChips` (`.sal.es-anclada`): barra con la píldora, ⚙, flecha y casa; título «Tienda». Estantes como chips con `aria-pressed` (contorno de oro, no macizo).
- **V2-A** (2): rejilla 1fr 1fr; cabe en todo.
- **V2-B** (5): en escritorio y en el S25 acostado caben las cinco. En **390, 360 y 412** quedan **2 tras el filo** (Avatares, Premium): fila desplazable con máscara de desvanecido a la derecha y `scroll-snap`; la activa (Monedas o Tapetes, las dos primeras) siempre a la vista. Los tres «Pronto» en gris con la pastilla de la casa.
- Estante **Monedas** = las dos filas de `HojaMonedas`, sin cambios. Se abre en Monedas por el «+», en Tapetes por «Tienda» y por la fila del ⚙ (marcas).
- **Recomiendo V2-B.**

### 3.3 · V3 · el estante de tapetes

Orden fijo de precio: verde · grafito · azul · vinotinto · tricolor. Pastilla del fieltro: **tres franjas** (claro · actual · oscuro) en los de pago con tonos; una sola en verde y tricolor (bandas). Estado: «✓ En uso» (oro de tinta, uno solo), «Usar» (chip de 44), precio con la Heptacoin, «Gratis».
- **V3-A**: filas de 56–84 px; cabe sin desplazar en todos los teléfonos verticales; en el S25 acostado el cuerpo desplaza 106 px (la lista entra con el dedo; la carcasa ya lo hace así).
- **V3-B**: 2 columnas en teléfono, 3 desde 760; en 360 desplaza 15 px, acostado 127.
- **Recomiendo V3-A** (cinco artículos; el nombre y la descripción respiran; el precio no se aprieta).

### 3.4 · V4 · la vitrina

Fondo + mesa + óvalo con los 8 tokens, luz cenital, riel y reflejos de LUZ-1, sombras de contacto en cartas y pozo, filtro en las fichas. Tres cartas reales (`src/assets/cards/webp`), el pozo con la Heptacoin y una pila de tres. Apaisada siempre. Debajo: muestras redondas (o pestañas encima), la descripción y el precio; al pie, anclado, el CTA de la carcasa: «Comprar · 25.000 HC» · «Usar» · «✓ En uso» (sin botón). **«No te alcanza: faltan 17.000 HC»** en la caja de la carcasa (`CajaAccion`, tipo nota), CTA atenuado y el enlace «Conseguir más monedas» encima.

**Alto útil del fieltro (óvalo), px:**

| | 1920×1080 | 1366×768 | 390×844 | 360×640 | S25 412×915 | S25 915×412 |
|---|---|---|---|---|---|---|
| V4-A | 360×140 | 262×102 | 197×77 | 182×71 | 209×81 | 194×75 |
| V4-B | 559×243 | 508×221 | 306×133 | 283×122 | 324×140 | 376×163 |

- La vitrina limita su ancho por el alto útil (`(100dvh − 78 u) × 1,6`), así que **nada empuja el CTA**: sin desplazamiento en todos los tamaños menos el acostado (+4 px; +51 con «No te alcanza», con el CTA anclado a la vista).
- **Acostado**: vitrina a la izquierda, tonos y ficha a la derecha (columna de 180 u).
- V4-B casi **duplica** el fieltro (×1,6–1,9) pero pierde la forma de mesa. En 360 el óvalo de V4-A mide 182×71 y las cartas se leen. **Recomiendo V4-A con muestras redondas.** Las pestañas (`?selector=pestanas`) suben el selector sobre la vitrina y en 360 dejaban sus zonas a 2 px de la flecha y la casa: con el aire de la cabecera (§6) quedan limpias.

### 3.5 · V5 · la ventana de compra

«¿Comprar **Vinotinto**?» · Precio 25.000 HC · Tu saldo 31.400 HC · **Te quedarán 6.400 HC** · «No» | «Sí, comprar» (dorado, 48 px). Estados dibujados: «Comprando…» (los dos botones bloqueados, `aria-busy`), error cerrado («No se pudo comprar. Tu saldo no cambió.», en la línea reservada: O1) y **«listo»**: la vitrina pasa a «✓ En uso» y aparece «¡Listo! Vinotinto es tu tapete». V5-A centrada (≤ 380 px) · V5-B hoja inferior (≤ 560, con el área segura). Ambas ≥ 44 en todo. **Recomiendo V5-A**: se lee como decisión de dinero y no se confunde con la hoja del ⚙.

### 3.6 · V6 · la fila del ⚙

«Tapetes» con el tapete en uso debajo («Negro grafito · oscuro»; «Verde clásico» sin tono), un disco de 20 px pintado con los tokens del tapete y tono en uso (la misma `.vit`) y «›». Fila de 243–406 × 44–73. Tres sitios dibujados (`?fila=`): arriba de Sonido, **entre Sonido e Idioma (recomendado)**, tras Idioma. En el S25 acostado la hoja ya desplaza y con la fila nueva «Cerrar sesión» queda a medio asomar en el filo (barrido 34,6): se alcanza desplazando, como hoy «Acerca de».

### 3.7 · V7 · el ⋮ sin «Tapetes» (boceto medido)

Sin `gameTable.css`, como pide la ficha: paneles de 64 × `altoPanel(n)`. **Hoy 244 / 200 → 1a 200 / 156** (IAS / humanos). El filete de «Mano actual» se queda. Ver R-6 para lo que toca la 1a.

---

## §4 · Los tonos (propuesta para sellar)

**Regla:** cada parada del tono de hoy con su H y su S, y la L de HSL × **1,24** (claro) o × **0,80** (oscuro). Es la misma operación que la `k` de Tapetes v1.1 (un grado de libertad por familia), así que el claro equivale a k = 0,84 / 0,97 / 1,07 y el oscuro a 0,54 / 0,62 / 0,69 (grafito / azul / vinotinto). Tintas: `--surface-game` = base del tono al 0,88; `--surface-area` y `-light` = abyss del tono al 0,45 y 0,30 (los alfas de hoy). El oro no cambia. Valores exactos en `laminas/tie1a/tonos.css`.

**Contraste** (WCAG). Texto claro `--text-primary` sobre `--green-bright` (lo más claro del óvalo: el peor caso), al 0,64 (estado de rival de LUZ-1) y al 0,62 sobre la mesa; oro `#e8b84b` sobre bright; papel de carta sobre bright (≥ 3 : 1, no es texto).

| tapete | tono | abyss | darkest | deep | base | bright | L* base | texto/bright | texto .64/bright | texto .62/mesa | oro/bright | carta/bright |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| verde | (hoy, referencia) | `#09170e` | `#0b1c11` | `#153922` | `#1b482c` | `#235c38` | 26,88 | 6,76 | **3,80** | 4,59 | **4,28** | 6,59 |
| grafito | claro (propuesta) | `#101013` | `#131416` | `#282a2d` | `#323539` | `#404449` | 22,02 | 8,40 | 4,53 | 5,20 | 5,32 | 8,18 |
| grafito | actual | `#0d0d0f` | `#0f1012` | `#202224` | `#282b2e` | `#34373b` | 17,35 | 10,25 | 5,24 | 5,72 | 6,49 | 9,98 |
| grafito | oscuro (propuesta) | `#0a0a0c` | `#0c0d0e` | `#1a1b1d` | `#202225` | `#2a2c2f` | 13,14 | 11,99 | 5,86 | 6,13 | 7,59 | 11,68 |
| azul | claro (propuesta) | `#0b131d` | `#0e1623` | `#1a2e47` | `#213a59` | `#2b4a72` | 23,90 | 7,74 | **4,22** | 4,94 | 4,90 | 7,53 |
| azul | actual | `#090f17` | `#0b121c` | `#152539` | `#1b2f48` | `#233c5c` | 18,95 | 9,61 | 4,96 | 5,51 | 6,08 | 9,35 |
| azul | oscuro (propuesta) | `#070c12` | `#090e16` | `#111e2e` | `#16263a` | `#1c304a` | 14,75 | 11,45 | 5,64 | 5,95 | 7,25 | 11,15 |
| vinotinto | claro (propuesta) | `#210a10` | `#290b14` | `#581325` | `#70192f` | `#8f1f3d` | 24,78 | 7,40 | **3,88** | 4,66 | 4,68 | 7,20 |
| vinotinto | actual | `#1b080d` | `#210910` | `#470f1e` | `#5a1426` | `#731931` | 19,28 | 9,41 | 4,69 | 5,30 | 5,96 | 9,16 |
| vinotinto | oscuro (propuesta) | `#16060a` | `#1a070d` | `#390c18` | `#48101e` | `#5c1427` | 14,64 | 11,35 | 5,42 | 5,82 | 7,19 | 11,05 |

- **Pasa 4,5 : 1** todo texto pleno y todo «.62 sobre la mesa». Por debajo, en negrita: el texto al 0,64 **sobre el centro del óvalo** en azul claro (4,22) y vinotinto claro (3,88), y el oro sobre el centro en el verde. Los tres están **por encima del 3,80 del verde de hoy**, que es el producto que ya se juega; además esos textos no se pintan sobre el centro desnudo sino sobre los paneles de asiento (tinta de zona). Si Victor quiere 4,5 estricto en el centro del claro, medido: azul ×1,13 (4,5; ΔL* ≈ 2,9) y vinotinto **≈ ×1,05** (4,5; ΔL* ≈ 1,1, que **no se distingue** del actual). Es decir: con 4,5 estricto en el centro del óvalo **el vinotinto no puede tener un claro visible** (su actual ya está en 4,69). Por eso propongo medir contra la referencia del verde de hoy y no contra 4,5 en el centro.
- **Distancia:** ΔL* claro–actual **4,7 / 5,0 / 5,5**, actual–oscuro **4,2 / 4,2 / 4,7**; ΔY **+48 / +49 / +54 %** y **−33 / −32 / −35 %**. Un 5 % de L daría ~1,5 de L*, que no se ve.
- **Siguen siendo ese tapete:** H y S idénticos parada a parada; el azul claro es H 214 S 45 % L 24 % (azul marino, no celeste); el vinotinto claro es el del pabellón de la camiseta, no un rojo bandera.
- **Luz (propuesta aparte, un 9.º mando):** `--luz-k` 0,85 en claro y 1,15 en oscuro (LUZ-1 midió sin regresiones hasta 1,5). La sombra interior del óvalo y de la mesa están escritas en `gameTable.css` (protegido) y no escalan: el claro las lleva igual que hoy. Si Victor prefiere 8 tokens exactos, se quita la línea y no cambia nada más.
- **La tira:** `capturas/TIRA_tonos.png` (y `pantalla.html?vista=TIRA`).

---

## §5 · Medidas por vista y tamaño

`<44` = zona o barrido bajo 43,9 (el 43,98 de dpr 3 es 44 de maqueta). «cuerpo +N» = el cuerpo de `.sal` desplaza N px (la carcasa lo prevé). Ninguna vista desplaza la página ni el lobby.

| vista | 1920×1080 | 1366×768 | 390×844 | 360×640 | 412×915 | 915×412 |
|---|---|---|---|---|---|---|
| V0 | ok | ok | ok | ok | ok | ok |
| V1A (y icono B) | ok | ok | ok | ok | ok | ok |
| V1B (y icono B) | ok | **<44 fila 40,6; pisa la barra 9,7** | ok | ok | ok | ok |
| V1C | ok | ok | **perfil 36,3** | **perfil 33,6; solape 1,4** | **perfil 38,3** | ok |
| V2A | ok | ok | ok | ok | ok | ok |
| V2B | ok | ok | 2 tras el filo | 2 tras el filo | 2 tras el filo | ok |
| V3A | ok | ok | 2 tras el filo | 2 tras el filo | 2 tras el filo | cuerpo +106 |
| V3B | ok | ok | 2 tras el filo | cuerpo +15 | 2 tras el filo | cuerpo +127 |
| V4A / V5A / V5B | ok | ok | ok | ok | ok | cuerpo +4 |
| V4A «No te alcanza» | ok | ok | ok | ok | ok | cuerpo +51 |
| V4B / V4A pestañas | ok | ok | ok | ok | ok | cuerpo +4 |
| V6 | ok | ok | ok | ok | ok | Cerrar sesión 34,6 (filo de la hoja) |
| V7 | — | ok | — | — | — | — |

Detalle por caso (cajas, zonas, barridos, estantes visibles, tokens): `capturas/medidas.json`.

---

## §6 · Desviaciones (D-n)

- **D-1 · V1-A no es «un botón nuevo»: es encender el que existe** (`lob-nav-tienda`). Por eso su Δ es 0 sin esfuerzo. V1-B y V1-C sí añaden uno, y V1-B deja dos puertas «Tienda».
- **D-2 · Aire bajo la cabecera de la tienda** (`padding-top` del cuerpo, 12 px o 3,4 u). Sin él, en 360×640 las zonas de 44 de la flecha y la casa pisaban la primera fila 6,3 px (estantes, o pestañas de tono). Es el mismo roce que Rankings ya tiene con sus pestañas (2,89 px, 1b-L).
- **D-3 · La tienda sale de la banda de dos columnas** de `salas.css` §16 (horizontal ≥ 900 × ≤ 830): esa regla parte todo `.sal-cuerpo` por `:nth-child` y mandaba la vitrina a la columna derecha en 1366×768 y en el S25 acostado. La lámina lo anula con 0,5,0 (`.sal.es-anclada .sal-cuerpo.es-tienda.es-tienda`); la 1a debería **excluir `.es-tienda` en la propia regla** (`:not(.es-retar, .es-armar, .es-tienda)`), que es más limpio. Trampa ya anotada en la 1b-L.
- **D-4 · V7 es un boceto medido**, como permite la ficha: sin `gameTable.css`, el panel se dibuja con las cifras de `altoPanel`.
- **D-5 · `?vista=` lleva además `V0` y `TIRA`** (referencia y tira), y la vitrina lleva `?selector=` para las dos formas del selector de tono.

## §7 · Contradicciones con §0 (no se deciden aquí)

- **C-1 · D-2 de la ficha y el «+».** Hoy el «+» abre una **hoja**, no una pantalla, y esa hoja la monta `MarcoVideo` junto con la capa del video, el cobro y la celebración. Si el «+» pasa a abrir la tienda en Monedas: (a) la tienda tiene que ir envuelta en `MarcoVideo` (como el lobby y las salas) para que «Ver un video» siga funcionando desde el estante; (b) hay que decidir si `HojaMonedas` **desaparece** o sigue para otras pantallas. Recomiendo que desaparezca: dos caminos al mismo video es confusión.
- **C-2 · «Conseguir más monedas».** El texto de la casa es **«Conseguir monedas»** (`video.hoja.titulo`); «… más monedas» se retiró en ECO-1g. La lámina usa `tie.conseguir` = «Conseguir más monedas» en el enlace de «No te alcanza», como dice §3 V4. Victor elige: clave nueva o reutilizar la de la hoja.
- **C-3 · «El ojito la respeta» (V2) frente a INV-69** («el ojito sólo tapa la píldora del lobby»). Hoy `BarraSuperior` sólo tapa la cifra si recibe `onOjito`, que sólo pasa el lobby: en la tienda la cifra se ve aunque el jugador la haya tapado. Respetarla pide pasar `saldoOculto` sin `onOjito` y tocar la redacción de INV-69. Y aun así la ventana de compra enseña «Tu saldo» (D-9 lo pide). **Decisión de Victor.**
- **C-4 · Nombres.** D-8 dice «negro»; el catálogo dice **«Negro grafito»** (`id: 'grafito'`). La lámina usa el catálogo, como pide §4. Los rótulos de `config/tapetes.js` están marcados como copy provisional.
- **C-5 · «PANEL_H».** La ficha habla de `PANEL_H`; ya no existe (salió con CFG-1 1e). La cifra es `altoPanel(filas)` y el test que la sella, `partidaRapida.test.js`.

---

## §8 · Textos (clave propuesta)

| Clave | Texto |
|---|---|
| `tie.titulo` | Tienda |
| `tie.estante.monedas` · `.tapetes` · `.reversos` · `.avatares` · `.premium` | Monedas · Tapetes · Reversos · Avatares · Premium |
| (reutiliza) `lob.toast.pronto` | Pronto |
| `tie.gratis` · `tie.en_uso` · `tie.comprado` · `tie.usar` | Gratis · En uso · Comprado · Usar |
| `tie.comprar` | Comprar · {precio} HC |
| `tie.tono` · `tie.tono.claro` · `.actual` · `.oscuro` | Tono · Claro · Actual · Oscuro |
| `tie.compra.titulo` | ¿Comprar {nombre}? |
| `tie.compra.precio` · `.saldo` · `.queda` | Precio · Tu saldo · Te quedarán |
| `tie.compra.si` · `tie.compra.no` · `tie.compra.comprando` | Sí, comprar · No · Comprando… |
| `tie.compra.error` | No se pudo comprar. Tu saldo no cambió. |
| `tie.falta` | No te alcanza: faltan {n} HC |
| `tie.conseguir` | Conseguir más monedas (ver C-2) |
| `tie.listo` | ¡Listo! {nombre} es tu tapete |
| `tie.cfg.tapetes` · `tie.cfg.valor` | Tapetes · {nombre} · {tono} |
| (reutiliza) `lob.nav.tienda`, `video.hoja.*`, `video.quedan`, `video.premio.corto` | el botón del lobby y el estante Monedas |

Los nombres y descripciones de los tapetes salen de `config/tapetes.js` (no se inventan).

---

## §9 · Lo que la 1a hereda de la lámina (para el rector)

1. `tapetes.css`: `body[data-tapete="x"] {` → `:is(body, .vit)[data-tapete="x"] {` en los cuatro bloques; los seis bloques de tono con `[data-tapete-tono]`; el tricolor de mesa y fondo con un selector más para `.vit-mesa` / `.vit-fondo` (y lo mismo en `luz.css` §6). La vitrina **no** copia valores.
2. La luz de la vitrina: la lámina inyecta los bloques de `luz.css`; en producción, `luz.css` declara sus tokens también para `.vit .vit-fondo` y los reflejos para `.vit-ovalo` (hoja no protegida), con el foco a escala (`9cqw`).
3. El contenedor de las `cqw` es `.vit`, no el fondo (un elemento no se consulta a sí mismo; la tira lo enseñó).
4. `useTapetes` tiene que poner `data-tapete-tono` junto a `data-tapete` en `<body>` al entrar en la mesa.
5. Arnés: puerta vitrina ↔ mesa por tono (§2 R-7) y los tres accesos por `.util-item-tapetes` recableados; `partidaRapida.test.js` a 4/3/200/156.

---

## §10 · Decisiones para Victor (STOP-L)

| | Opciones | Rector | Claude Code |
|---|---|---|---|
| **V1** | A / B / C · icono A (toldo) / B (bolsa con Heptacoin) | A | **A, icono A** (Δ = 0; B mueve el centro y pisa la barra en 1366; C rompe el perfil en teléfono) |
| **V2** | A (2) / B (5, tres «Pronto») | B | **B** |
| **V3** | A (filas) / B (rejilla) | A | **A** |
| **V4** | A (mesa entera) / B (centro) · redondas / pestañas · **los seis tonos** | A, redondas | **A, redondas**; tonos ×1,24 / ×0,80 (o ajustar, tapete por tapete) |
| **V5** | A (centrada) / B (hoja) | A | **A** |
| **V6** | arriba de Sonido / **entre Sonido e Idioma** / tras Idioma | junto a Sonido e Idioma | **entre Sonido e Idioma** |
| **V7** | `altoPanel`: 200 (IAS) / 156 (humanos) | — | visto bueno |
| **Textos** | §8 | — | ver C-2 |
| **C-1 · C-3** | la hoja del «+» se va o se queda · el ojito en la tienda | — | se va · decisión de Victor |
| **Luz** | `--luz-k` por tono (0,85 / 1,15) o 8 tokens exactos | — | con `--luz-k` |

---

## §11 · `git status`

```
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md          (ya estaba)
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md  (ya estaba)
?? docs/reportes/AJILEI_TIE-1_Fase1aL_Informe_v1.0.md        (este informe)
?? laminas/mon1/…                                            (ya estaba)
?? laminas/tie1a/                                            (la lámina; sin seguimiento, no se commitea)
```
`laminas/` no está en `.gitignore`: la lámina queda sin seguimiento, como `laminas/mon1/`. Dentro quedan dos sondas sueltas (`_sonda.mjs`, `_factor.mjs`) y `capturas/_rev1.png`, `_corrida.txt`, porque `rm` está denegado; se pueden borrar. Nada de `src/`, `scripts/`, `supabase/`, `public/` ni `package.json`. Sin commits. Vite sigue levantado en el 5174 para la revisión de Victor. **STOP-L.**
