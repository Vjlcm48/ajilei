# AJILEI · TAB-1 · Fase 0 · «La mesa según el tamaño» · Informe v1.0

- **Para:** el rector · **Decisor:** Victor · **De:** Claude Code
- **Base:** `main` en `9fef917`. Solo lectura y medida: sin cambios en `src/`, sin commits, sin `db push`.
- **Fecha:** 2026-10-18 · **Tiempo:** de 17:03 a 17:34 de reloj (31 min, dentro del tope de 120).
- **Instrumento:** sondas propias en el scratchpad. Usan `contextoCap` y `recorrerRuta` (la sesión simulada de CAP-1) contra `vite preview`. La matriz se midió en el 4173. Los prototipos de escala corrieron en un preview aparte (4191/4192) mientras la cadena de varas ocupaba el 4173. Navegadores: Chromium 151.0.7922.34 (el sellado) y WebKit 26.5.
- **Estado:** STOP. No hay lámina ni código. Este archivo queda sin seguimiento.

---

## 1. Resumen para Victor

1. Tienes razón: la mesa no crece. Las demás pantallas del juego (lobby, Retar, Salas) sí se agrandan en el iPad, con letras de 17 a 26 px. Dentro de la mesa, en el mismo iPad, las letras se quedan en 10 a 14 px.
2. En el iPad mini en vertical, el juego usa tal cual la mesa del teléfono. La carta mide 12 mm, igual que en tu S25. Pero el iPad se mira desde más lejos, así que se ve un 25–30 % más pequeña que en el teléfono.
3. En las tabletas más anchas (desde 768 px) la mesa vertical no tiene diseño propio. Sale una cuadrícula vieja con botones bajos, y en las mesas de 4 y 5 la frase se sale del óvalo.
4. En la laptop con poco alto (la tuya, 1366×623), hoy hay que desplazar 90 px para ver «Siguiente mano», «Recargar» y el pie. Lo he probado: **reduciendo todo un 8 % cabe entero, sin desplazar y sin tocar nada más.**
5. En el iPad horizontal el diseño de escritorio ya llena la pantalla. **Con una sola escala no puede crecer más.** Para que crezca habría que quitar aire del diseño.
6. En pantallas grandes la mesa se queda fija en 1032×746 px: en un monitor 4K ocupa el 10 % de la pantalla. He probado a ampliarla ×1,45 en 1920×1080 y queda bien. Falta fijar el tope.
7. Recomiendo agrandar con la propiedad `zoom` del navegador: un solo factor, el mismo en Chrome y en Safari. En el teléfono no se aplica nada, así que queda idéntico al píxel.
8. Para el iPad vertical, la variante A (la mesa del teléfono ampliada ×1,3) ya está **medida**: carta de 99,5 px (15,5 mm) y frase de 17 px. La B (asientos alrededor del óvalo) solo está **estimada**: carta parecida y letra más pequeña. Las dos se verán lado a lado en la lámina.
9. Un hallazgo de tus fotos: en pantalla completa, el iPad no le da a la página toda la pantalla. En horizontal tapa una franja de unos 28 px abajo, y por eso el pie parecía rozar el borde.

---

## 2. Hallazgos numerados

| # | Hallazgo | Evidencia |
|---|---|---|
| **TF-1** | **Hoy hay tres trajes y una base huérfana.** A, teléfono vertical: `(max-width:767px) and (orientation:portrait)`. B, teléfono horizontal: `(orientation:landscape) and (max-height:600px)`. C, escritorio: `(orientation:landscape) and (min-height:601px)`. D, la base: vertical de 768 px de ancho o más, sin traje. El iPad mini vertical (744) cae en **A**; las tabletas verticales de 768 en adelante caen en **D** | `GameTable.jsx:104,110,119`; `gameTable.css:1165-2379` (A), `:2397-4243` (B), `:4251-6289` (C), `:1-1110` + `:1130` (D) |
| **TF-2** | **No existe ninguna escala global, y el escritorio tiene un tope duro.** Lo fijan cuatro cosas: `#root{width:1126px}`, `.game-table{width:min(860px,100%)}`, el `:root` de 16/18 px y todas las fuentes en px. Por eso, desde 1194×834, la mesa de 5 mide siempre 1032×746. **Ocupación:** 0,37 en 1920×1080, 0,23 en 2560×1300 y 0,10 en 3840×2000 | `index.css:18,28,57`; `gameTable.css:20`; T3 |
| **TF-3** | **Alto útil real del iPad mini 6, deducido de las fotos:** 744×**1047** en vertical con barras y 1133×**658** en horizontal con barras (la barra de Safari mide 86 px CSS en los dos casos). Las estimaciones de IOS-1 eran 1026 y 637, 21 px menos. En pantalla completa: ≈1133×716 empezando en y≈23–31 y ≈744×1072 empezando en y≈34 | §5.2; filas 121–122 de las fotos |
| **TF-4** | **La emulación reproduce el iPad.** Con WebKit y el alto útil deducido, **todas las anclas caen dentro del 1 %**. La única excepción es la foto de las 4:08 (2,6–2,8 %), que estaba desplazada 27 px. Chromium y WebKit difieren como mucho en 6,4 px, y solo en el ancho de los botones (la fuente del sistema) | §5.2 |
| **TF-5** | **Medida física.** El iPad vertical pinta la carta al mismo tamaño que el S25 (12,0 mm frente a 11,7 mm), pero a más distancia. En tamaño angular, la tableta es **la peor clase**: carta 0,77× y frase 0,68× del S25. La laptop queda en 1,16× y 0,91×, y el monitor de 24" en 1,25× y 0,80×. Las distancias de visión son una hipótesis | §3.T3.d |
| **TF-6** | **Laptop 1366×623, mesas 4 y 5:** hoy desplaza 90 px, y «Iniciar mano», «Siguiente mano», «Recargar», los botones, los chips y el pie quedan fuera. **Con `zoom: 0,92` todo cabe** sin desplazar y sin solapes, en turno y entre manos; con 0,874 sobran 39 px. Con un piso de 0,9 **no hace falta quitar aire** en este tamaño | prototipos L0.874, L0.92, L0.95 |
| **TF-7** | **Una ventana de laptop de ≤600 px de alto recibe el traje del teléfono acostado (B):** 1280×600, 1280×585, 899×600 y 900×600. Allí la frase baja a 9 px y el óvalo mide 34–38 px de alto. Le pasa lo mismo al Safari del iPad en ventana (foto de las 4:12) | T3; `GameTable.jsx:104` |
| **TF-8** | **`zoom` funciona igual en Chromium 151 y en WebKit 26.5:** mismas cifras. `getBoundingClientRect` da la caja visual, mientras que `fontSize` y `offsetWidth` siguen sin ampliar. Las **unidades de ventana se multiplican** por el factor: hay que corregir el `100dvh` de la pantalla, y en el traje A también 9 reglas con `svh`/`vw`. El traje C no tiene ninguna | prototipos; `gameTable.css:6` y la lista de §3.T4 |
| **TF-9** | Con el `zoom` solo sobre `main`, **en escritorio la mesa se estrecha**: `#root` (1126 px) queda fuera del elemento ampliado, el óvalo de la mesa 5 baja a 168 px y la frase sale 33,5 px. **Con el `zoom` sobre `#root` todo cabe:** a 1920×1080 ×1,45, carta de 167 px y ocupación de 0,71. Queda un desplazamiento del documento de 486 px por anular | prototipos z145h y R1.45 |
| **TF-10** | **El iPad horizontal no crece con el traje de escritorio.** La mesa de 5 necesita ≈670–677 px propios de alto. Con 688 visibles (pantalla completa) el factor máximo es ≈1,0; con barras (658), ≈0,97. Para crecer en tableta horizontal hay que quitar aire del traje | T3 y prototipos L* |
| **TF-11** | **La pantalla completa del iPad no da la pantalla entera.** En horizontal, una banda oscura de ≈28 px CSS tapa el pie de la página: el borde inferior de la zona del jugador y el marco quedan debajo, y «Mesa 50» queda a ≈19 px de la banda | fotos de las 4:43 y 4:34 h; §3.T5 |
| **TF-12** | **Variante A medida: ×1,3 cabe en 744×1047 en las mesas 4 y 5.** Carta de 99,5×154, botones de 52, chips de 33 (con su zona de 40 ×1,3 = 52), con o sin bandas. **En las mesas 2 y 3 se rompe** (el pie sale 270 px fuera): el óvalo usa `max(96px, 100svh − estático)`, y el `zoom` multiplica ese `100svh` | prototipos A1.3 y AB1.3_430; `gameTable.css:1628,1981` |
| **TF-13** | **Fuera de la mesa ya existe la escala:** `--u = clamp(3.2px, 1vmin, 6px)` en lobby, Salas y video. En 744×1047, el lobby, Retar y Salas van a 17,4–26,4 px, frente a 11,3–17,2 en 390×844. **La mesa es la única pantalla que no crece** | `lobby.css:66`, `salas.css:56`; sonda `fuera.mjs` |
| **TF-14** | **Ninguna línea del código sabe si la app está en pantalla completa.** Como la petición se hace sobre `documentElement`, `:root:fullscreen` permitiría reservar la esquina de la ✕ de Safari (y el pie de TF-11) **solo** entonces | `pantallaCompletaCore.js:84`; sin `:fullscreen` en ningún CSS |
| **TF-15** | **Botones en tableta:** 33 px de caja (en D y en C con dedo), con zona `::after` de 40, por debajo de 44 | T3 |
| **TF-16** | **Celular, hoy:** cero celdas que no quepan, cero textos fuera y cero solapes en los 11 tamaños de teléfono (los 7 de A y los 4 de B) × 4 mesas × 2 estados | T3 |

---

## 3. Tareas

### T1 · Inventario: cómo decide hoy la mesa su tamaño

**T1.1 · Trajes.** Las tres media queries tienen su espejo en JSX: `useMediaQueryMatch` (`GameTable.jsx:131-142`), los hooks de `:144-156` y su lectura en `:525-527`. Ninguno mira el puntero ni el modelo; el puntero solo entra en sub-bloques (`pointer:coarse` en `gameTable.css:4311,4546,5842,5968,6204` y en `tactil.css`). El código no lee el UA para la maqueta (grep de `userAgent`/`maxTouchPoints` vacío fuera de la pantalla completa).

| Traje | Condición | Sub-bandas | Qué clase lo usa hoy |
|---|---|---|---|
| **A** · teléfono vertical | `(max-width:767px) and (orientation:portrait)` | A′ con `max-height:772px`: cartas de 51–58 (`:2000-2014`) | celular vertical **y el iPad mini vertical (744)** |
| **B** · teléfono horizontal | `(orientation:landscape) and (max-height:600px)` | `max-width:772` / `min-width:773` | celular horizontal **y toda ventana horizontal de ≤600 de alto** (1280×600, 899×600, Safari del iPad en ventana) |
| **C** · escritorio (DSK) | `(orientation:landscape) and (min-height:601px)` | ≤800 de alto (`:root` a 16, `:4260-4265`); 801–899 sin regla propia; ≥900 (cartas de 91×142, `theme.css:120-125`) | tableta horizontal, laptop y escritorio |
| **D** · base huérfana | vertical con ancho ≥768 | `:1130` (cuadrícula 2×2 en las mesas 4 y 5 con `min-width:768` y `min-height:601`) + escalón 900 | **tableta vertical de 768 en adelante** |

**T1.2 · Unidades.** Todas las de la mesa están en **px**; solo hay **3 líneas en rem** en todo `gameTable.css`.

| Elemento | A (teléfono vertical) | C (escritorio) / D |
|---|---|---|
| Carta del jugador | `--hcard-w: clamp(61px,(100vw−80px)/5,75px)` (`gameTable.css:1190`); A′ `clamp(51…58)` (`:2013`) | C: `--dsk-hand-w`, % de `.cards-row` con `aspect-ratio` (`:4942-4959`); D: `--card-w/h` px (`theme.css:103-104`, `:122-123`) |
| Carta de las IAS · `.opp-panel` (5/4/3) | `calc(30*var(--pv5-k))` con `k = clamp(0.85px,(50vw−40px)/140,1.25px)` (`:2229,:2288,:2357`) | `calc(var(--card-w)*0.55)` (`opponentPanel.css:7-8`) |
| Carta de la IA · `.ai-zone` (mesa 2) | `--card-w/h` (61×95) | `--card-w/h` (76 o 91) |
| Nombre / estado del asiento | 13 px / 13 px (`:1642`) | 13 px / **22 px** (`opponentPanel.css:68,1048`) |
| Frase del óvalo | 13 px, alto 28 (`:1325`) | 14 px, alto 54 (`:183-196`); B: **9 px** |
| Pozo (cifra) | 20 px (`:1322`) | 26 px (`:142-150`) |
| «Comodín activo» | 10 px (`:1958`); A′ 8 px | 11 px (`:897-907`) |
| «Mano #N» | 10 px (`:587-590`) | 10 px |
| Saldo / «Mesa 50» | 18 px (`balanceDisplay.css:8`) / 11 px | 18 px / 14 px (`:2979`) |
| Insignias | 10 px, `padding 2px 8px` (`:980-989`) | ídem; fila reservada en rem (`:4297`) |
| Temporizador | 18 px (`:1952`) | 20 px (`:810-818`) |
| Botones / chips | 12 px, alto mínimo 40 (`:1931,:1941`) / 12 px | 13 px, `padding 9px 18px` (`:487-491`) / 12 px (`:527-533`) |
| «Iniciar/Siguiente mano», «Recargar» | `.btn.btn-primary` / burbuja de 40 px (`rec.css:27-48`) | ídem |
| Logotipo | `Wordmark` en em sobre 18 px (`:1267`) | 22 px (`:43-47`) |
| ⋮ y ✕ | `menuMovil.css` / `.btn-leave` 13 px | 40,61×32 (`:5749`) / `.btn-leave` |

**El óvalo:**
- **Base y C:** es un sobrante de flex (`.center-zone{flex:1}`, `:97-122`).
- **A:** alto fijo de O1 (`--o1-oval-h:119px`, `:1222`). En las mesas 3 y 2 usa `max(96px, 100svh − estático)` (`:1628`, `:1981`), con `svh` a propósito (`:1219`).
- **C:** columnas congeladas `--o2-*` (`:5513-5540`).

**T1.3 · `seatLayouts.js`.** Solo exporta **nombres de ranura**, no coordenadas:
- `SEAT_LAYOUTS` (`:5-10`), `DECK_ANCHORS` (`:19-26`), `rivalSeatsInDisplayOrder` (`:32`), `effectiveLayout` (`:43`) y `livingRivalsInDisplayOrder` (`:54`).
- Lo usan `GameTable.jsx:54,673,2029-2031,2326-2344` y `OpponentPanel.jsx:4,68`, que pinta la clase `opp-${seatPos}`.

**Un traje nuevo de asientos no exige tocarlo**: se hace por CSS sobre `.opp-*` y `.table-five…`, en una hoja propia, como `apu/luz/voz2/rec/tactil.css`. Los límites:
- la mesa 3 no tiene asientos laterales;
- la mesa 2 en vertical va por `.ai-zone` desde el JSX (`:2315`);
- las insignias de letra, `cornerChip` y `desktopHeader` dependen de los tres hooks (`:1904-1909`, `:2009-2011`). Cambiarlas toca `GameTable.jsx`, que no está protegido.

**T1.4 · Lo que se pinta encima de la mesa.** Todo cuelga de `main.game-table-screen` y es **hermano** de `.game-table`. No hay portales salvo el video y el aviso de saldo (`MarcoVideo.jsx:88`, `AvisoSaldo.jsx:54`).

| Capa | Dónde | Posición | Con `zoom` en `main` o en `#root` | Con `transform` en `.game-table` |
|---|---|---|---|---|
| Tarjeta de recarga (blanda y forzosa) | `GameTable.jsx:2849-2851` | `fixed; inset:0`, z120 | se amplía; con `inset:0` sigue cubriendo la ventana | no la alcanza |
| Burbuja «Recargar» | dentro de `.game-table` (`:2607`) | absolute | se amplía | se amplía |
| Bancarrota | ya no existe: la sustituye la recarga (`:1159`) | — | — | — |
| Globo de VOZ-2 | `:2794` | fixed, z20; **JS en coordenadas de la ventana** (`Voz2Capa.jsx:43-46`) | **se descoloca ×f**: hay que dividir por el factor | no la alcanza |
| Menú ⋮ | `:2680` | fixed (`:5859`, `menuMovil.css:177`) | se amplía con sus distancias | no lo alcanza |
| Resultado / celebración | `:2805-2806` (fixed, z26 y z32); pantalla de victoria dentro de `.game-table` (`:2282`) | fixed / en flujo | se amplían | solo la de victoria |
| Cartas en vuelo | hermanas, fixed (`:657`) | coordenadas medidas | **riesgo ×f, como VOZ-2** (sin medir) | no las alcanza |

**T1.5 · Pantalla completa al girar a vertical dentro de la mesa.** **Es intencionado.** `pantallaCompletaCore.js:28-35` lo dice así: «IOS-1 1a (P1, opción C+B)… Al girar a vertical no se sale a propósito (R3 sigue): Safari la suelta solo, y si no, la mesa vertical queda como en la app instalada». Hay más pruebas:
- `pideAqui` (`:71-74`) solo pide en Safari del iPad dentro de la mesa y en horizontal;
- no hay llamada de salida ni oyente de `fullscreenchange` u `orientationchange`;
- la prueba 12 (`pantallaCompletaCore.test.js:268`) fija que en vertical no se vuelve a pedir.

La captura de las 4:34 en vertical es el caso «si no» del comentario. Lo que no consta en el informe de la 1a es si Safari soltó la pantalla completa o no; esta captura demuestra que **a veces no la suelta**.

### T2 · Calibración

Ver §5.2: la vara de ±3 % se cumple y el control rojo sale rojo. **La emulación sirve de sustituto del iPad**, con el alto útil de TF-3 y no el nominal.

### T3 · Medida: la mesa de hoy en toda la gama

**Matriz:** 64 tamaños (los 39 de `tam` más 25 de la ficha) × mesas 2, 3, 4 y 5 × reposo y turno = **512 celdas**, con 0 sin medir, 0 errores y 0 inestables. A eso se suman **129 celdas «entre manos»** en horizontal y **33 celdas de WebKit** de calibración.

Ficheros en el scratchpad:
- CSV: `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\41ec08d5-bbc4-419c-b53a-2523ef593265\scratchpad\tab1\t3_matriz.csv`;
- crudo: `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\41ec08d5-bbc4-419c-b53a-2523ef593265\scratchpad\tab1\t3_chromium.json`;
- entre manos: `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\41ec08d5-bbc4-419c-b53a-2523ef593265\scratchpad\tab1\t3_entre.json`.

El globo de VOZ-2 **no se midió**: hace falta un toque sobre una frase truncada. Queda propuesto para el modo nuevo `tab` (§4).

**Cómo se mide:** la caja pintada con `getBoundingClientRect`, tras desplazar a 0 y con dos lecturas iguales seguidas. Así se descuenta el `timerPulse`. «Cabe» significa la caja entera dentro de la ventana sin desplazar. El «desborda» de los botones se descartó: es su zona táctil `::after`, no el texto.

**T3.a · Resumen por clase.** Px CSS; peor–mejor valor. «Clase» se asigna por puntero y lado corto, como en el §1 de la ficha.

| Clase | Tamaños | Traje hoy | Carta jugador (ancho) | Carta IA | Frase | Nombre / estado | Mano #N | Botón (alto) | Chip | Ocupación | Celdas que no caben |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Celular vertical | 7 | A | 58–76 | 34–65 | 13 | 12–13 / 13 | 10 | 28–40 | 26 | 0,74–0,87 | **0** |
| Celular horizontal | 4 | B | 74–100 | 38–104 | **9**–12 | 13 / 15 | 10 | 28 | 23 | 0,85–0,90 | **0** |
| Tableta vertical | 14 | A (744) y D (≥768) | 77–93 | 41,5–95 | 13–14 | 12–13 / 13–22 | 10 | **33**–40 | 26–28 | **0,43**–0,90 | 0, pero la **frase sale del óvalo** en las mesas 4 y 5 de 768–820 de ancho (hasta 50,2 px) |
| Tableta horizontal | 18 | C | 94–115 | 46–95 | 14 | 13 / 22 | 10 | 33 | 28 | 0,43–0,82 | **1133×637/641/658 y 1280×648**, mesas 4 y 5 (también la 2 en 637/641) |
| Laptop | 11 | C, y **B si el alto es ≤600** | 84–101 | 46–105 | **9**–14 | 13 / 15–22 | 10 | 28–33 | 23–28 | 0,46–0,92 | **1366×623/633 y 800×601/611**: «Iniciar/Siguiente mano», «Recargar», botones, chips y pie (desplaza 47–112 px) |
| Escritorio | 10 | C | 95–115 | 46–95 | 14 | 13 / 22 | 10 | 33 | 28 | **0,08**–0,63 | 0 |

**T3.b · Tamaños de referencia, mesa 5 en turno.** Las demás mesas están en el CSV.

| Tamaño | Traje | Carta J | Carta IA | Frase | Botón | Ocupación | Óvalo | Cabe | Desplaza |
|---|---|---|---|---|---|---|---|---|---|
| 360×640 | A′ | 58×90 | 34×51 | 13 | 28 | 0,80 | 318×96 | sí | 0 |
| 390×844 | A | 64×98,5 | 37×56 | 13 | 40 | 0,80 | 348×119 | sí | 0 |
| 412×915 (S25) | A | 68×105 | 40×60 | 13 | 40 | 0,82 | 370×119 | sí | 0 |
| **744×1047** (iPad mini con barras) | A | **77×119** | 41,5×63 | 13 | 40 | 0,87 | 512×119 | sí | 0 |
| 768×1024 | D | 93×144 | 54×82 | 14 | **33** | 0,64 | **106**×195 | sí, **frase fuera 28,6** | 0 |
| 834×1194 | D | 93×144 | 54×82 | 14 | 33 | 0,55 | 172×195 | sí | 0 |
| 1024×1366 | D | 93×144 | 54×82 | 14 | 33 | 0,50 | 362×218 | sí | 0 |
| **1133×716** (iPad mini a pantalla completa, WebKit) | C | 94×133 | 46×69 | 14 | 33 | 0,80 | 534×160 | sí | 0 |
| **1133×658** (iPad mini con barras) | C | 94×133 | 46×69 | 14 | 33 | 0,82 | 534×157 | **no** (pie a +9,3) | 55 |
| **1366×623** (laptop de Victor) | C | 94×133 | 46×69 | 14 | 33 | 0,68 | 534×157 | **no** (pie a +44,3) | **90** |
| 1280×600 | **B** | 101×143 | 50×76 | **9** | 28 | 0,81 | 486×**38** | sí | 0 |
| 1440×760 | C | 94×133 | 46×69 | 14 | 33 | 0,64 | 534×204 | sí | 0 |
| 1920×1080 | C ≥900 | 115×163 | 54×82 | 14 | 33 | **0,37** | 464×234 | sí | 0 |
| 2560×1300 | C ≥900 | 115×163 | 54×82 | 14 | 33 | **0,23** | 464×234 | sí | 0 |
| 3840×2000 | C ≥900 | 115×163 | 54×82 | 14 | 33 | **0,10** | 464×234 | sí | 0 |

**T3.c · Entre manos** (con «Tu mejor palo» y «Recargar»). No caben:
- **mesas 5 y 4:** 1133×637, 1133×641, 1133×658 (solo el pie), 1280×648, 1366×623, 1366×633, 800×601 y 800×611;
- **mesa 2:** 1366×623 (Recargar y pie), 1366×633 (pie a +0,9), 800×601 y 800×611.

**T3.d · Medida física (mesa 5 en turno).**

| Referencia | mm/px | Carta jugador | Frase | Mano #N | Distancia supuesta | Carta / frase frente al S25 (ángulo) |
|---|---|---|---|---|---|---|
| S25 en Chrome, 412×915 (416 ppi, DPR 2,8125) | 0,1717 | 68×105 px = **11,7×18,1 mm** | 13 px = 2,23 mm | 1,72 mm | 30 cm | 1,00 / 1,00 |
| S25, 384×744 | 0,1717 | 10,3×16,0 mm | 2,23 mm | 1,72 mm | 30 cm | 0,88 / 1,00 |
| iPad mini 6 vertical, 744×1047 (326 ppi, DPR 2) | 0,1558 | 77×119 px = **12,0×18,5 mm** | 13 px = 2,03 mm | 1,56 mm | 40 cm | **0,77 / 0,68** |
| iPad mini 6 horizontal, 1133×658 | 0,1558 | 14,7×20,7 mm | 14 px = 2,18 mm | 1,56 mm | 40 cm | 0,94 / **0,73** |
| Laptop HP 15,6", 1366×623 (96 ppi) | 0,2646 | 24,9×35,2 mm | 3,70 mm | 2,65 mm | 55 cm | 1,16 / 0,91 |
| Monitor 24", 1920×950 (92 ppi) | 0,2761 | 31,8×45,0 mm | 3,87 mm | 2,76 mm | 65 cm | 1,25 / 0,80 |

**Lectura.** En milímetros, la tableta no es más pequeña que el teléfono. Es más pequeña en ángulo, porque se mira más lejos, y es justo la clase de la queja de Victor. Para igualar al teléfono, la tableta necesitaría un factor de ≈1,3–1,45. Las distancias son una hipótesis: las cifras en mm sí están medidas.

### T4 · Propuesta técnica (sin código)

**T4.1 · Clasificación.** Por espacio y puntero, nunca por modelo.
- **Táctil** = `(any-pointer: coarse)`. Con `any-` y no `pointer`, un iPad con teclado y trackpad sigue siendo táctil, y la laptop táctil también.
- **Lado corto** = `min(innerWidth, innerHeight)`.

| Clase | Condición | Traje | Factor |
|---|---|---|---|
| Celular | táctil y lado corto < 600 | A / B, **sin tocar** | 1, **sin atributo** |
| Tableta vertical | táctil, lado corto ≥ 600 y vertical | **A ampliada** o **B nuevo** (decide Victor) | `f_TV` |
| Tableta horizontal, laptop y escritorio | horizontal y lado corto ≥ 600, o ratón | C | `f_H` (T4.3) |

Justificación de los umbrales con T3:
- **600** es el corte donde hoy acaba el teléfono acostado. El celular más grande en horizontal (932×430, 915×412) se queda en B sin fallos.
- La línea de **830** (banda B de la 1e) solo separa dónde empieza a crecer la mesa. Por debajo de ≈677 hay que reducir; entre 677 y 830 la mesa cabe a escala 1, como hoy.

Bordes:
- **Ventanas de iPadOS y pantalla dividida.** Se clasifican por su tamaño real. Hoy una ventana de ≤600 de alto cae en B (foto de las 4:12); con la clasificación, una ventana táctil de lado corto 600 o más iría a C (pregunta R-2).
- **Cambio en caliente.** Un solo hook calcula clase y factor con `resize` y `matchMedia`, y los escribe como **atributo y variable en `<html>`**. Solo depende de la ventana, **nunca del contenido**, así que cumple O1. Los tres hooks de traje ya cambian a mitad de mano hoy; el factor es solo CSS. Hay dos riesgos para la Fase 1: las cartas en vuelo y el globo de VOZ-2, que fijan coordenadas al salir.
- **El factor no depende de la mesa.** Se calcula para la mesa de 5, que es la peor, para que no salte al eliminarse un asiento.

**T4.2 · Mecanismo de escala.** Los cuatro, con medidas reales de los prototipos (estilo inyectado desde la sonda, sin tocar `src/`).

| Criterio | (i) `--escala` × cada tamaño | (ii) `cqw`/`cqh`/`cqmin` | (iii) `transform: scale()` | **(iv) `zoom`** |
|---|---|---|---|---|
| Nitidez | nítido (se maqueta a su tamaño) | nítido | rasterizado escalado; riesgo de borrosidad con `will-change` y animaciones | **nítido**: se maqueta a tamaño real |
| Zona táctil | escala si cada zona usa la variable | ídem | escala visualmente | **escala**: a ×1,3 los botones miden 52 y la zona de los chips 52 |
| `getBoundingClientRect` y arnés | caja real | caja real | caja transformada | **caja visual** (ampliada), igual en los dos motores. `fontSize` sigue sin ampliar: el arnés debe multiplicar |
| `position: fixed` y capas | intactas | intactas | **se rompen** bajo un ancestro transformado (pasan a colgar de él) | se amplían con sus distancias (medido); bien con `inset:0`; **VOZ-2 y los vuelos** escriben px de la ventana y hay que dividirlos por f |
| Dos caminos de pintado | hay que reescribir los dos | ídem | cubre los dos si envuelve `.game-table` | **cubre los dos** (mesas 5/4/3 y 2 medidas) |
| O1 | sin efecto | sin efecto | sin efecto | sin efecto: f depende solo de la ventana |
| Regla de los óvalos | reescribe su CSS | reescribe su CSS | uniforme | **uniforme**: el óvalo no se deforma |
| Unidades de ventana | — | — | no se multiplican | **se multiplican** (TF-8): hay que corregirlas, nunca en C, sí en A |
| Soporte | universal | Safari 16+ / Chrome 105+; **WebKit aplica dos veces el `zoom` a `cqw`** (75 frente a 112,5) | universal | Chromium 151 y WebKit 26.5 iguales (medido). Safari lo admite desde siempre. La sonda no puede probar iPadOS 27 real: lo que se mide es el WebKit 26.5 de Playwright |
| **Protegidos que abre** | **≈1.190 líneas con px** (1.096 en `gameTable.css` y 94 en `opponentPanel.css`) | lo mismo | ninguno para el escalado, pero obliga a sacar las capas fixed | **ninguno en C** (todo aditivo, ver T4.4). En A: las 9 reglas con `vw`/`svh` (`gameTable.css:1190, 1402, 1576, 1628, 1981, 2013, 2229, 2288, 2357`) como gemelas aditivas, o con `/ var(--escala, 1)` |

**Recomiendo (iv), `zoom`, sobre `#root`.** Es el único que escala todo con un solo número, sin reescribir los dos protegidos, sin romper las capas fixed y sin pérdida de nitidez. Lo he medido igual en los dos motores. Lo que cuesta está acotado y medido:
- corregir el alto de la pantalla (`100dvh` en `gameTable.css:6`), de forma aditiva;
- anular el desplazamiento del documento que deja `#root` ampliado;
- dividir por f en `Voz2Capa.jsx` y en los vuelos (no protegidos);
- en el traje A, las 9 reglas de ventana.

**T4.3 · El factor.**

| Clase | Fórmula | Referencias (medidas) | Ejemplos |
|---|---|---|---|
| Celular | f = 1 | — | todos |
| Tableta vertical (A) | f = clamp(1, min(W/572, H/805), 1,6) | **572×805**: la ventana propia en que A cabe a ×1,3 en 744×1047 (mesas 4 y 5; con 1,4, el pie a +13) | 744×1047 → **1,30** (medido) · 744×1072 → 1,30 · 768×938 → 1,17 · 820×1073 → 1,33 · 834×1108 → 1,38 · 800×1128 → 1,40 · 1024×1259 → 1,56 |
| Horizontal con H < 830 (tableta y laptop) | f = clamp(**0,9**, H/**677**, 1) | **677** = 623/0,92, el alto propio mínimo en que cabe la mesa de 5 (con 0,95 el pie a +10) | 1366×623 → **0,92** (medido, cabe) · 1366×633 → 0,935 · 1133×658 → 0,97 · 1133×716 → 1 · 1366×768 → 1 |
| Horizontal con H ≥ 830 | f = clamp(1, min(W/1126, H/830), **tope**) | 1126 = `#root`; 830 = el mínimo de `.game-table` (`:1116`) | 1920×950 → 1,14 · 1920×1080 → **1,30** · 2560×1080 → 1,30 · 2560×1300 → 1,50 (tope) · 3840×2000 → 1,50 |

- **Piso 0,9.** La letra más pequeña de la mesa (10 px: «Mano #N» e insignias) baja a 9 px, la misma que ya usa la frase del traje B en el teléfono, que está aprobada. Con el piso, 1366×623 (0,92) y 1366×633 no necesitan quitar aire.
- **Tope 1,5, provisional, a decidir en la lámina.** Medido a 1920×1080 ×1,45 (zoom en `#root`): carta de 167 px (46 mm, 1,8× la del S25 en ángulo) y ocupación de 0,71. Propongo 1,3–1,5; por encima se pasa del teléfono en ángulo.

**T4.4 · Celular intacto, al píxel.** En celular **no se escribe atributo ni variable**, y todas las reglas nuevas viven bajo `[data-escala]` en una hoja propia. El teléfono no evalúa ni una regla distinta de hoy.

Las 9 gemelas de A también van bajo el atributo. Si en cambio se editaran las reglas protegidas con `calc(… / var(--escala, 1))`, el valor sería numéricamente idéntico, pero abriría el protegido: lo desaconsejo.

Se demuestra con:
- `diagPUE cap`: el raster sellado de `mesav.png` a 360×704@3, la prueba más fina;
- `diagDSK gate`, `o1` y `a1` (`A1_PRE`), `tactil` (celdas de teléfono), `tam` (celdas de celular) y `vuelos`;
- un modo nuevo `tab` (propuesto), que compara las celdas de celular de esta matriz (CSV de T3) **byte a byte** antes y después.

**T4.5 · Tableta vertical: variantes A y B.**

| | **A · la mesa del teléfono ampliada** | **B · traje propio alrededor del óvalo** |
|---|---|---|
| Qué es | Traje A ×f; con bandas, la mesa a 430 px propios y centrada | Asientos IA3/IA2 arriba, IA4 \| óvalo \| IA1 en medio y el jugador abajo |
| `seatLayouts.js` | intacto | intacto (CSS sobre `.opp-*`); la mesa 2 (`.ai-zone`, `GameTable.jsx:2315`) y la mesa 3 piden su propio arreglo |
| Protegidos | **744:** ninguno con gemelas aditivas de las 9 reglas. **≥768:** abrir la puerta de A (`max-width:767px`), 2 líneas en `gameTable.css` y 2 en `opponentPanel.css`, más el hook `GameTable.jsx:110` y 6 hojas no protegidas | **todas las anchuras:** cerrar A a las tabletas (las mismas 4 líneas protegidas) y anular la base D (aditivo) |
| **744×1047** | **medido:** f = 1,3 → carta **99,5×154 px (15,5 mm)**, frase 16,9 px, Mano #N 13, botones 52, carta IA 52,8 (mesas 4 y 5). Con bandas de 92 px: la misma carta (está en su tope de 75 propios). **Las mesas 2 y 3 necesitan las gemelas de `:1628/:1981`** (sin ellas el pie sale 270 px) | **estimado, sin medir:** caja ≈712×836 propios con piezas de C → f ≈ 1,04 → carta ≈98, frase ≈14,6, Mano #N ≈10,4 |
| **834×1194** (≈834×1108 con barras) | estimado: f ≈ 1,38 → carta ≈103–106, frase ≈18 | estimado: f ≈ 1,17 → carta ≈110, frase ≈16,4 |
| Lectura | Más letra (el teléfono tiene la letra grande respecto de la carta) y menos trabajo | Usa mejor el ancho y se parece al escritorio, pero con letra ≈15 % más pequeña y 3–4 veces más trabajo |

**T4.6 · Laptop, caso (c).**
- **1366×623:** el factor que cabe es **0,92** (medido: pie a −8,9 px, sin desplazar, mesas 5 y 2, turno y entre manos). La letra queda en frase 12,9, Mano #N 9,2 y botón 12. **Está sobre el piso: no hace falta quitar aire.**
- **1280×600:** hoy está en **B** (TF-7). Si se pasara a C haría falta f = 600/677 = 0,886, **bajo el piso**. Con 0,9 faltarían ≈10 px propios de aire; a 1280×585, ≈27.

El aire disponible en C, medido a 1366×623, suma **≈58 px propios** sin tocar cartas, letra ni óvalo:

| Hueco | Hoy | Propuesto | Gana |
|---|---|---|---|
| Cabecera → rivales | 10 | 0 | 10 |
| Relleno superior de la zona del jugador | 18 | 8 | 10 |
| Carta → cronómetro | 28 | 12 | 16 |
| Botones → borde de la zona | 16 | 8 | 8 |
| Margen inferior de la pantalla | 22 | 8 | 14 |

Todo ese aire vive en el bloque DSK de `gameTable.css`, que es protegido. Por eso la recomendación es **no quitar aire en la Fase 1** (pregunta R-2).

**T4.7 · Plan de la lámina.**
- **Cómo se hace:** estilos inyectados sobre la app real, como `laminas/ios1d`, sin tocar `src/`. Mesa 5 y mesa 2 en cada tamaño, para cubrir los dos caminos.
- **Base de la doctrina:** 1920×1080 · S25 vertical y horizontal (412×915 y 915×412) · 390×844 · 360×640.
- **Añadidos:**
  - 1366×623 (hoy y ×0,92);
  - 744×1047 con **A ×1,3 sin bandas, A ×1,3 con bandas y B** (maqueta), las tres **lado a lado y a la misma escala física**;
  - 1133×658 y 1133×716 (pantalla completa, con la banda de 28 px pintada);
  - 834×1108 (A estimada y B);
  - 2560×1300 con tope 1,3 y 1,5.
- **Cada panel lleva su factor, la carta en mm y la frase en px.**

**T4.8 · Plan de sub-tandas de la Fase 1** (minutos de Claude Code).

| Sub-tanda | Contenido | Min |
|---|---|---|
| **1a · Lámina** | §T4.7; incluye maquetar B | 120–150 |
| — Victor | **elegir A o B y el tope (no se comprime)** | — |
| 1b · Núcleo | hook de clase y factor + atributo en `<html>` + pruebas de la fórmula con las cifras de T3 | 45–60 |
| 1c · Laptop y escritorio | hoja `escala.css` (zoom en `#root`, alto corregido, documento sin desplazar) + `Voz2Capa` y vuelos divididos por f | 90–120 |
| 1d · Tableta vertical | A: gemelas de las 9 reglas + bandas (≥768, con la puerta autorizada) · o B: traje nuevo | A: 90 · B: 240–300 |
| 1e · Arnés | modo `tab` (esta matriz con veredicto; celular byte a byte; piso táctil 44 en tableta; globo de VOZ-2) + `webkit`/`tam` con el alto útil de TF-3 | 90–120 |
| 1f · Varas, sellos y cierre | re-sellado de las líneas base de escritorio que cambie el crecimiento, registro de invariantes, informe | 60–90 |
| — Victor | **validación: laptop HP, S25 y monitor. El iPad ya no estará: la tableta se valida con WebKit calibrado (TF-4)** | — |

### T5 · Hallazgos menores

1. **La ✕ de Safari sobre el logotipo.** En pantalla completa horizontal, la ✕ ocupa ≈x 21–78 y y 32–77 de la pantalla, encima de la cabecera. No hay hoy ningún estado de pantalla completa en el código (TF-14). Como se pide sobre `documentElement` (`pantallaCompletaCore.js:84`), `:root:fullscreen` existe en los dos motores y permite **reservar la esquina solo entonces**, en una hoja propia y sin JS. `(display-mode: fullscreen)` es de la PWA (`:45`) y no conviene mezclarlos.
2. **El pie de las 4:43.** En la ventana real (≈1133×716), la emulación deja el marco de `.game-table` a 8 px del borde inferior, la zona del jugador a 22 px y «Mesa 50» a 47 px. **La maqueta no se sale.** Lo que se ve en la foto es la **banda oscura de ≈28 px** que Safari pinta sobre el pie en pantalla completa (TF-11): corta en recto el borde de la zona del jugador y el marco. La misma regla `:root:fullscreen` puede reservar ese pie.
3. **Fuera de la mesa** (dueño por decidir). En 744×1047 y 834×1108, el lobby, Retar y Salas van a 17,4–26,4 px (mediana 20,4–21,6) y el botón dorado mide 384×66. En 390×844 iban a 11,3–17,2 px con botón de 250×44. Ya crecen con `--u` (TF-13). Sin problema que señalar; la diferencia con la mesa es justo el caso de TF-1.

---

## 4. Varas

### 4.1 · Las del §5

| Vara | Esperado | Obtenido |
|---|---|---|
| vitest | 1.617 verdes | **1.617 passed** (6,7 s) |
| lint | 21 | **21** (20 errores y 1 aviso, `GameTable.jsx:782`; código de salida 1, como la línea base) |
| build | correcto | **correcto** (`npm run build`, código 0) |
| `diagDSK tam` | VERDE | **VERDE**: tam.1 a tam.12 ✓, 448 puntos (55 con filas recorridas), 273 celdas, aislamiento verde, código 0 |
| `diagDSK retar` | 6/6 | **6/6**, código 0 |
| `diagDSK webkit` | verde | **VERDE** (WebKit 26.5): 20 celdas que cuentan y 10 con LIMITACIÓN, código 0 |
| Protegidos | huella final = inicial | **iguales los seis** (§7) |
| `git status` | lo de antes + este informe | **sí** (§7) |

### 4.2 · Calibración de T2 (WebKit 26.5 frente a las fotos)

Escala de las fotos: 1 px CSS = 1,411 px de foto. Origen vertical: el borde de la barra de Safari, en la fila 121–122 de la foto (86 px CSS). Desviación en % del ancho (x) o del alto (y) de la ventana. **Vara: ±3 %.**

| Foto | Celda emulada | Ancla | Δx | Δy | % |
|---|---|---|---|---|---|
| 4:30 vertical con barras | 744×1047, turno | carta del jugador | 0,4 | 2,7 | 0,0 / 0,3 |
| | | «Apostar 50» | −0,5 | 0,9 | 0,1 / 0,1 |
| | | TURNO | −2,0 | 1,5 | 0,3 / 0,1 |
| | | saldo (moneda) | 3,5 | 0,0 | 0,5 / 0,0 |
| | | pozo, frase, Mano #N, cronómetro, carta IA, ⋮, logo | superpuestas: coinciden al contorno | | < 1 |
| 4:08 vertical con barras, reposo | 744×1047, reposo | «Iniciar mano» | 0,8 | **−26,8** | 0,1 / **2,6** |
| | | saldo | 13,7 | **−29,0** | 1,8 / **2,8** |
| 4:34 horizontal, pantalla completa | 1133×716 (origen y = 22,6) | «Apostar 50», TURNO, ⋮ | | −1,4 / −0,8 / 2,2 | ≤ 0,3 |
| | | pozo, frase, Mano #N, cronómetro, carta IA, carta J, saldo | superpuestas: coinciden | | < 1 |
| 4:43 horizontal, pantalla completa, entre manos | 1133×716 (origen y = 31,1) | carta J, «Siguiente mano», ⋮ | | −0,6 / −0,8 / 1,5 | ≤ 0,2 |
| 4:13 horizontal con barras, entre manos | 1133×658, entre | carta J | 0,6 | 1,3 | 0,1 / 0,2 |
| | | «Siguiente mano» | −3,0 | −0,4 | 0,3 / 0,1 |
| | | saldo | 3,6 | −0,1 | 0,3 / 0,0 |
| 4:34 vertical, pantalla completa (extra) | 744×1072 (origen y = 34,5) | carta J, «Apostar», TURNO, ⋮ | | ≤ 1,3 | ≤ 0,1 |

Notas:
- **Alto útil por ajuste:** con barras sale 1047 (residuo ≤ 1,4 px); con 1026 sale 1,6 % y con el nominal 1133 a pantalla completa, 3,9 %. Por eso las cifras de TF-3.
- **La foto de las 4:08** está desplazada 27 px: la cabecera asoma cortada bajo la barra. Es un desplazamiento uniforme, no un error de maqueta, y aun así queda dentro de la vara.
- **Anchos de botón:** el iPad los pinta 7–15 px más anchos (SF frente a la fuente de Windows). Es tamaño, dentro del ±3 % del ancho.
- **Chromium frente a WebKit**, en 744×1047, 744×1133, 1133×744, 1133×658 y 1133×637: máximo 6,4 px, solo en el ancho de «Apostar»; fuentes calculadas idénticas. **La matriz de T3 en Chromium es válida.**

**Control rojo («un rojo debe significar lo que dice»).** En 1133×658 entre manos, la emulación da **pie fuera = sí (+9,3 px)** y **la pantalla desplaza 55 px**. «Siguiente mano» llega hasta 657 de 658, igual que en la foto de las 4:13, donde corta el borde de la pantalla. En 1133×637 da +30,3 y 76 px, con «Siguiente mano» y «Recargar» fuera. **Sale ROJO, como debe.**

Imágenes de comprobación:
- `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\41ec08d5-bbc4-419c-b53a-2523ef593265\scratchpad\tab1\fotos\overlay_4_744x1047_turno.png`
- `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\41ec08d5-bbc4-419c-b53a-2523ef593265\scratchpad\tab1\fotos\overlay_3_1133x716_corr.png`

---

## 5. Propuesta recomendada (una página)

- **Clases.** Celular: táctil (`any-pointer: coarse`) y lado corto < 600. Tableta vertical: táctil, lado corto ≥ 600 y vertical. Horizontal ancho: tableta horizontal, laptop y escritorio, con una sola fórmula. Se calculan en un hook a partir de la ventana, nunca del contenido ni de la mesa. Se escriben como `data-escala` y `--escala` en `<html>`.
- **Mecanismo.** `zoom: var(--escala)` sobre `#root`, en una hoja nueva `escala.css` bajo `[data-escala]`, con tres piezas más:
  1. alto de la pantalla `calc(100dvh / var(--escala))`, gemela aditiva de `gameTable.css:6`;
  2. documento sin desplazar;
  3. `Voz2Capa.jsx` y los vuelos divididos por el factor.
- **Factores:**
  - celular 1, sin atributo;
  - tableta vertical `clamp(1, min(W/572, H/805), 1,6)`;
  - horizontal con H < 830: `clamp(0,9, H/677, 1)`;
  - horizontal con H ≥ 830: `clamp(1, min(W/1126, H/830), tope)`.
- **Piso** 0,9: la letra mínima queda en 9 px, la de la frase del teléfono acostado. **Tope** 1,5, provisional, se cierra en la lámina (1,3–1,5).
- **Resultados medidos:**
  - laptop 1366×623 ×0,92: todo cabe, sin desplazar y sin quitar aire;
  - iPad vertical ×1,3: carta de 15,5 mm, frase de 17 px y botones de 52;
  - escritorio 1920×1080 ×1,3–1,45: ocupación de 0,37 a 0,6–0,7.
- **Celular intacto:** no recibe atributo, así que no evalúa ni una regla nueva. Se prueba con `diagPUE cap` (raster sellado), `gate`, `o1`, `a1`, `tactil`, `tam` y `vuelos`, y con el modo `tab`, byte a byte.
- **Tableta vertical:** recomiendo **A** (medida, más letra, menos trabajo), con bandas si a Victor le gusta el aire a los lados. Antes, lámina lado a lado con B.
- **Tableta horizontal:** f ≈ 1 en el iPad mini (TF-10). Se acepta en la Fase 1; crecer exige quitar aire de C, que es protegido.
- **Protegidos:**

  | Archivo | Rango | Cuándo |
  |---|---|---|
  | `gameTable.css` | ninguno con gemelas aditivas | laptop, escritorio y el iPad mini 744 |
  | `gameTable.css` | 9 reglas de A (`:1190, 1402, 1576, 1628, 1981, 2013, 2229, 2288, 2357`) **solo** si se prefieren editadas a gemelas | — |
  | `gameTable.css` + `opponentPanel.css` | la puerta de A, 4 líneas (2 y 2) | si se elige A para ≥768 o B a cualquier ancho |
  | `gameTable.css` | la puerta de C, 4 líneas | si 1280×600 pasa a escritorio (R-2) |
  | `gameTable.css` | ≈58 px de aire en el bloque DSK | solo si se quita aire |
  | `seatLayouts.js`, motor, IA y baraja | ninguno | — |

---

## 6. Preguntas al rector

1. **R-1 · ¿Mecanismo `zoom` sobre `#root`?** Recomiendo **sí**: está medido en los dos motores, no reescribe los protegidos y respeta las capas fixed y la nitidez.
2. **R-2 · Ventanas con ratón de ≤600 de alto** (1280×600, 899/900×600) y Safari del iPad en ventana: hoy van al traje del teléfono acostado (frase de 9 px, óvalo de 34–38 px). ¿Pasan a escritorio? Eso abre la puerta de C (4 líneas protegidas) y obliga a quitar 10–27 px de aire. Recomiendo **sí, pero en una sub-tanda propia y posterior**, no en la primera de TAB-1.
3. **R-3 · Tableta horizontal sin crecimiento** (TF-10). ¿Se acepta f ≈ 1 en el iPad mini en la Fase 1? Recomiendo **sí**, y mostrar en la lámina un panel con el aire quitado para que Victor juzgue si merece abrir C.
4. **R-4 · Si Victor elige A, ¿se autoriza abrir la puerta de A** (`max-width:767px`, 4 líneas en dos protegidos) para las tabletas de ≥768? Sin eso, A solo llega al iPad mini. Recomiendo **sí**: es una condición, no geometría.
5. **R-5 · Las líneas base de escritorio** (1920×1080 y demás) cambiarán si la mesa crece. ¿Re-sellar, o medir los modos sellados con un interruptor del arnés que fuerce la escala 1? Recomiendo **el interruptor** (`addInitScript`), más el modo nuevo `tab` para la escala.
6. **R-6 · Tope:** ¿1,3, 1,5 o 2,0? Recomiendo decidirlo en la lámina entre 1,3 y 1,5.
7. **R-7 · Pantalla completa del iPad:** ¿reservar la esquina de la ✕ y los ≈28 px del pie con `:root:fullscreen` dentro de TAB-1? Recomiendo **sí**: es la misma hoja, sin JS y sin protegidos.
8. **R-8 · Alto útil del arnés:** ¿actualizar `webkit` y `tam` a 744×1047 y 1133×658, y añadir 1133×716 (pantalla completa)? Recomiendo **sí**, en la 1e (TF-3).
9. **R-9 · Fuera de la mesa** (T5.3): no hay defecto. Recomiendo **cerrarlo sin dueño**.
10. **R-10 · El iPad no estará después de hoy.** ¿Aceptan el rector y Victor validar la tableta con el WebKit calibrado (TF-4) en lugar del aparato? Recomiendo **sí**, avisando de que no simula la banda de pantalla completa ni las barras reales: se aplican por tamaño.

---

## 7. Cierre

- **Procesos:** ningún Node vivo de esta fase. Todas las sondas y los modos terminaron solos. Comprobado al final con `tasklist` y `netstat`.
- **Puertos** 4173, 4191, 4192 y 5174: libres.
- **Protegidos:** `git hash-object` al empezar y al terminar.

| Archivo | Inicio | Final |
|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318…` | igual |
| `src/engine/aiPlayer.js` | `8cfc3736cba2…` | igual |
| `src/engine/deck.js` | `eb61426083ca…` | igual |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8…` | igual |
| `src/styles/opponentPanel.css` | `3ce6383eec0d…` | igual |
| `src/styles/gameTable.css` | `1e21371c8543…` | igual |

- **Creado en el scratchpad** (Victor lo borra a mano), todo bajo `C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\41ec08d5-bbc4-419c-b53a-2523ef593265\scratchpad\tab1\`:
  - **sondas:** `sonda.mjs`, `plan.mjs`, `fotos.py`, `calib.py`, `ajuste.py`, `analisis.py`, `zoom.mjs`, `fuera.mjs`;
  - **planes:** `humo.json`, `plan.json`, `plan_entre.json`, `calib.json`, `exp.json`, `exp2.json`, `exp3.json`, `exp3w.json`, `exp4.json`, `t52.json`;
  - **resultados:** `t3_chromium.json`, `t3_rows.json`, `t3_matriz.csv`, `t3_entre.json`, `t2_webkit.json`, `t52_webkit.json`, `exp_chromium.json`, `exp2_chromium.json`, `exp3_chromium.json`, `exp3_webkit.json`, `exp4_chromium.json`, `humo_out.json`, `huellas_inicio.txt`, `huellas_final.txt`, `fotos_comp.json` (a medias: el volcado falló por los enteros de numpy y no se usa);
  - **registros:** `t3_chromium.log`, `vara_vitest.log`, `vara_lint.log`, `vara_build.log`, `vara_tam.log`, `vara_retar.log`, `vara_webkit.log`;
  - **imágenes:** la carpeta `fotos\` (capturas de la sonda, superposiciones y recortes).
- **`dist/`:** se recompiló con `npm run build` y con el `tam` del arnés; está ignorado por git.
- **`git status` final** (17:34; `git diff` vacío):

```
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? docs/reportes/AJILEI_TAB-1_Fase0_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
```

**No se continúa a ninguna Fase 1.** El rector y Victor deciden con este informe.
