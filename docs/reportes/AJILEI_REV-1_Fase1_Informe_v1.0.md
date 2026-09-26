# AJILEI · REV-1 · Reverso único
## Fase 1 · Informe de implementación · v1.0

**Fecha:** 2026-09-25
**Ficha:** `AJILEI_REV-1_Fase1_v1.0.md`
**Base:** `main` en `808b580`, **sin commits**
**Hoja de la 1b:** `capturas-rev/fase1b/hoja.html` (hoy | después)
**Hoja de la 1a:** `capturas-rev/fase1a/hoja.html`

## Resumen

**El modo `rev` sale VERDE en las 10 celdas, con las cinco puertas y la oclusión probada.** Dentro de la mesa, todo reverso es ahora la copia de mesa. Las cartas del humano en apaisado, la voladora hacia él y la IA de mesa 2 en S25 horizontal enseñan el dibujo entero: marco y broches al 100 %, cuando hoy se ven al 96,3–97,5 %.

- **Causa (b) resuelta:** en los nueve lugares que la tenían, el Δ contra el canónico baja de 15,6–17,2 a **5,7–9,4**, dentro de la franja del control (3,0–13,2).
- **Cambios de producto:** una línea de `PlayingCard.jsx`, una de `GameTable.jsx` y una regla nueva en `rev.css`.
- **Fuera de la mesa:** la Portada y la sala de espera siguen con el original, sin un solo valor computado distinto.
- **La voladora en tiempo real:** ningún fotograma sin pintar (0 de 255 con voladora).
- **Comprobaciones finales:** pruebas 993/993, lint en la línea base (20 errores, ninguno nuevo), `gate` 6/6, `luz` completo VERDE y build limpio con la copia emitida con hash.

**Hay dos desviaciones que el rector tiene que conocer (§8):**

1. **La puerta 4 salió roja en la primera pasada por el instrumento, no por el dibujo.**
   - **El laboratorio de la Fase 0** rasterizaba el SVG sin borde, en posición entera y sin capa compuesta.
   - **Lo que pasa con la copia:** el borde de la caja, su fase de subpíxel y la capa de las animaciones mueven la imagen intermedia alrededor de 1 píxel de dispositivo. A 27×42 eso vale 11–15 de Δ.
   - **La corrección:** el laboratorio reproduce ahora la caja propia (borde, radio, color, fase y capa). Con ella, cada lugar da 0,05–0,27 salvo la voladora en pleno vuelo (3,2–10,5).
   - **El umbral de 12 no cambió.**
2. **El Δ contra el canónico sube en los mazos de móvil de mesa 2** (7,1 → 13,8). Es informativa y no es puerta. La causa es la misma fase de píxel: a esa escala la copia queda ~⅓ de px CSS desplazada respecto del original. El dibujo es el mismo, como confirma la puerta 4 con 0,05–0,15.

---

## 1 · Parte 1a · La copia ensanchada

Aprobada por Victor en el chat del rector (STOP 1).

**Construcción** (ficha §2.1), con `capturas-rev/fase1a/genMesa.mjs`, idempotente al byte:

- raíz `viewBox="0 0 1005 1420" width="1005" height="1420"`;
- todo el original, `<defs>` incluidas, dentro de `<g transform="translate(47.5 0)">`;
- sólo las dos `rect` del campo (color y `pattern` de la raya) pasan a `x="-47.5" width="1005"`;
- `diff` contra el original: el raíz, un comentario, la apertura y el cierre del grupo y las dos `rect`.

Ningún elemento del dibujo toca el canto: el marco va de x = 53 a 857 y los broches laterales de 42 a 868. No hizo falta el STOP del §2.1.

**Varas del §2.2:**

| Vara | Resultado | |
|---|---|---|
| 1 · Zona central idéntica | Media 0 y máximo 1, a DPR 1 y a DPR 3. Control con la ventana movida 1 u: media 1,34, máximo 207 | ✔ |
| 2 · Continuidad de la raya | 0 en las dos costuras, igual que el campo original y la tela añadida. Cruzando la raya en la costura: 1,03 (la métrica la ve) | ✔ |
| 3 · Cajas estrechas ≈ hoy | 8 de 10 como `background`; las dos que exceden (35,6×55,7: 1,03/2,02 y 42,5×66,4: 3,67/7,92) dan 0 como SVG en línea: fase de subpíxel del raster intermedio. En línea, las 10 ≤ 0,17 | Aceptada por el rector |
| 4 · Marco completo en cajas anchas | 100 % en las 6 cajas anchas (hoy, 96,3–97,5 %) | ✔ |

**Peso:** 7 501 B, md5 `5708ac06fa129483259b8522e261b5d9` (original: 6 994 B). En el build sale como `dist/assets/reverso_carta_mesa-Be9HJvqX.svg` (7,50 kB), con hash y aparte, igual que con `?no-inline`.

**Cajas intermedias (0,642–0,656).** La copia deja de recortar el 0,1–1,2 % por lado que recortaba el original: el dibujo se ve entero y un poco más pequeño. Aceptado por el rector; en la puerta 2 del modo `rev` cuentan según su lugar y se reportan aparte (§3).

---

## 2 · Parte 1b · Qué cambió

| Archivo | Cambio |
|---|---|
| `src/components/PlayingCard.jsx` | **Sólo la línea 3:** `reverso_carta.svg?no-inline` → `reverso_carta_mesa.svg?no-inline`. El `object-fit: cover` inline de la línea 9 no se toca |
| `src/styles/rev.css` (nuevo) | Una regla: `.game-table-screen :is(.deck-pile, .flying-card, .shuffle-fan-card) { background-image: url('../assets/cards/reverso_carta_mesa.svg'); background-color: #41101c; }` |
| `src/components/GameTable.jsx` | **Una línea:** `import '../styles/rev.css'` como último import, tras `luz.css` |
| `scripts/diagDSK.mjs` | El modo `rev` (§3), su línea en la cabecera de uso y su línea en el despacho |
| `docs/AJILEI_Sistema_Diseno_v1.2.md` | Nota 8 del §12 (§5 de este informe) |

Ningún protegido se editó.

### 2.1 Especificidad y declaraciones de `background` vencidas

La regla nueva es **0,2,0**: `.game-table-screen` (0,1,0) más `:is(...)`, que aporta la mayor de su lista (0,1,0). Carga la última, detrás de `luz.css`.

Inventario de **todas** las declaraciones de `background` y `background-image` que alcanzan las tres clases. Hecho con un recorrido de todos los `.css` de `src/styles/` y `src/components/`, contando los bloques anidados en `@media`, y con un `grep` de los JSX:

| Declaración | Archivo:línea | Selector | Especificidad | ¿Gana `rev.css`? |
|---|---|---|---|---|
| `background: url(reverso_carta.svg) center / cover no-repeat` | `gameTable.css:642` | `.deck-pile` | 0,1,0 | Sí, por especificidad |
| ídem | `gameTable.css:664` | `.flying-card` | 0,1,0 | Sí |
| ídem | `gameTable.css:1080` | `.shuffle-fan-card` | 0,1,0 | Sí |

No hay ninguna más:

- **Variantes D del mazo** (`gameTable.css:856`, `860`, `1770`, `1795`, `1816`): sólo tamaño.
- **`.opp-deck` y `table-five`/`four`/`three`/`wide`** (`gameTable.css:1656–1663`, `2079–2082`, `2247–2248`, `2306–2307`, `2374–2375`, `2545–2552`) y `opponentPanel.css`: sólo caja y posición.
- **`luz.css`:** sólo `box-shadow`.
- **Estilos inline** (`FlyingCard`, `ShuffleDeck`, el mazo de `OpponentPanel.jsx:121`): no declaran fondo.

Como sólo se pisan `background-image` y `background-color`, el tamaño (`cover`), la posición y la repetición del shorthand se conservan. La puerta 3 lo confirma con el valor computado en cada instancia de cada celda y estado.

La sombra de pila de LUZ-1 es `box-shadow` y no se cruza: el modo `luz` completo sigue verde (§7).

---

## 3 · El modo `rev`

`node scripts/diagDSK.mjs rev` (servidor 5173 con bypass; la Portada en `REV_BASE_PORTADA`, por defecto 5174).

- **Celdas y estados:** las 10 celdas (mesas 5 y 2 × pc, s25v, s25h, 390, 360) y los 4 estados de la Fase 0: reposo, reparto, vuelo y abanico. El congelador es el de la Fase 0, literal.
- **Azar:** sembrado con 20260925.
- **Muestra:** 237 instancias medidas.
- **Salida:** JSON por celda, `_rev.json`, capturas completas y recortes en `capturas-rev/fase1b/`. Victor a DPR 1: `REV_DPR=1 REV_SUF=_dpr1 node scripts/diagDSK.mjs rev 2 pc`.

**Correcciones de instrumento pedidas por la ficha:**

- **Opacidad efectiva 1 (§J-5).** Mientras se dispara el recorte, el arnés inyecta `.turn-dimmed { opacity: 1 !important }` y lo retira después. Es una hoja del arnés, no del producto. Cada recorte guarda su opacidad en el momento del disparo, y fue 1 en todos.
- **Oclusión por intersección de cajas (§J-6).** Una instancia está tapada si otra carta, mazo, voladora o abanico que pinta encima la corta en más de 1 px². «Encima» significa voladora o abanico por capa, o un hermano posterior en el orden del documento.
  - **El caso sabido:** en m2 pc y m5 pc, la voladora recién nacida está sobre el mazo en «reparto», y el mazo sale tapado (1/1 y 1/1).
  - En las otras 8 celdas la voladora ya no cruza el mazo en ese instante, así que no hay caso que probar.

### 3.1 Las cinco puertas, celda a celda

Corrida final: **VERDE** · 10 celdas · 237 instancias medidas en los 4 estados.

| Celda | 1 · Δ = 0 | 2 · Marco | 3 · Asset y fondo | 4 · Dibujo: mazo · abanico · voladora · (IA) · humano |
|---|---|---|---|---|
| m5 pc | ✓ | ✓ | ✓ | ✓ 3,31 · 3,01 · 5,81 · 0,27 |
| m5 s25v | ✓ | ✓ | ✓ | ✓ 0,07 · 0,13 · 10,51 · 0,15 |
| m5 s25h | ✓ | ✓ | ✓ | ✓ 0,08 · 0,16 · 6,71 · 0,19 |
| m5 390 | ✓ | ✓ | ✓ | ✓ 0,09 · 0,18 · 3,23 · 0,21 |
| m5 360 | ✓ | ✓ | ✓ | ✓ 0,14 · 0,18 · 9,15 · 0,23 |
| m2 pc | ✓ | ✓ | ✓ | ✓ 0,06 · 0,11 · 4,82 · 0,11 · 0,21 |
| m2 s25v | ✓ | ✓ | ✓ | ✓ 0,14 · 0,14 · 4,81 · 0,13 · 0,15 |
| m2 s25h | ✓ | ✓ | ✓ | ✓ 0,05 · 0,15 · 3,67 · 0,19 (opp) · 0,19 |
| m2 390 | ✓ | ✓ | ✓ | ✓ 0,14 · 0,14 · 7,54 · 0,06 · 0,21 |
| m2 360 | ✓ | ✓ | ✓ | ✓ 0,12 · 0,14 · 9,91 · 0,11 · 0,23 |
| **m2 pc a DPR 1** (Victor) | ✓ | ✓ | ✓ | ✓ 0,06 · 0,14 · 3,52 · 0,05 · 0,24 |

*Cifras de la corrida final (`capturas-rev/fase1b/_rev.json` y `_rev_dpr1.json`). Las de la voladora varían hasta ±1 entre corridas, porque se recorta en pleno vuelo; los lugares quietos repiten a la centésima.*

- **Puerta 1:** Δ máximo 0 en todas las cajas de `.game-table-screen` en los 4 estados de las 10 celdas. Cada `<img>` del reverso coincide con la caja de contenido de su `.card-back` a menos de 0,01 px.
- **Puerta 2:** marco dorado al **100,000 %** en **todas** las instancias, las de mazo y abanico incluidas, y también con los broches. La ficha pedía ≥ 99 % en mazo y abanico: con la copia, sus cajas de 0,630–0,656 escalan por el alto y ya no recortan el dibujo.
- **Puerta 3:** las 237 instancias usan `reverso_carta_mesa.svg`. Mazo, voladora y abanico computan `background-color: rgb(65, 16, 28)`; con la hoja apagada eran `rgba(0, 0, 0, 0)`.
- **Puerta 4:** 45 lugares limpios, con valores de 0,05 a 10,51 (umbral 12):
  - cartas, 0,06–0,27;
  - mazo y abanico, 0,05–3,31;
  - voladora, 3,23–10,51.

  La voladora se recorta **en pleno vuelo** (40 % de la transición), con `transform` fraccionario. Su resto es la interpolación de esa capa, no el dibujo.
- **Puerta 5:**

  | Pantalla | Viewport | Reversos | Con el original | Con la copia | Difieren con `rev.css` encendida y apagada |
  |---|---|---|---|---|---|
  | Portada (5174, sin bypass) | 1920×1080 | 13 | 13 | 0 | 0 |
  | Portada | 412×915 | 13 | 13 | 0 | 0 |
  | Sala de espera (`?sal=espera-anfitrion`) | 1920×1080 | 3 | 3 | 0 | 0 |
  | Sala de espera | 412×915 | 3 | 3 | 0 | 0 |

### 3.2 Cajas intermedias (0,642–0,656), en su bloque (decisión del rector)

| Lugar | Cajas | Celdas | Marco | Marco + broches |
|---|---|---|---|---|
| Mazo y abanico | 21×32, 23,25×35,42, 24,89×37,94, 27×42 (0,643–0,656) | m5 360, 390, s25v, s25h · m2 360, 390, s25v, s25h | 100 % (umbral ≥ 99 %) | 100 % |
| Humano y voladora hacia él | 62×96,55 y 66,39×103,41 (0,642) | m5 390, s25v · m2 390, s25v | 100 % (umbral 100 %) | 100 % |
| IA `.ai-zone` y voladora hacia ella | 61×95 (0,642) | m2 390, s25v | 100 % (umbral 100 %) | 100 % |

En todas, la copia escala por el alto y no recorta el dibujo. El recorte cae sólo en la tela añadida: 4,0–4,6 % del `viewBox` por lado.

### 3.3 Informativas

**Δ contra el canónico de la Fase 0, antes → después**, en los nueve lugares con causa (b). Todos bajan a la franja del control (3,0–13,2):

| Lugar | Antes | Después |
|---|---|---|
| m5 pc · voladora | 17,16 | **8,47** |
| m5 pc · humano | 16,64 | **7,39** |
| m5 s25h · voladora | 17,08 | **5,74** |
| m5 s25h · humano | 16,31 | **9,34** |
| m2 pc · voladora | 17,06 | **9,36** |
| m2 pc · humano | 15,62 | **7,59** |
| m2 s25h · voladora | 16,50 | **7,93** |
| m2 s25h · humano | 16,31 | **9,34** |
| m2 s25h · IA opp-panel | 16,50 | **8,48** |

En el resto, el Δ contra el canónico apenas cambia en las cartas: la IA de m2 pc pasa de 3,03 a 3,99, y el máximo es el humano de m2 s25v, de 8,07 a 10,86. En los mazos y abanicos varía en los dos sentidos:

- **Bajan** en mesa 5: de 11,1–17,2 a 8,1–15,2.
- **Suben** en los de mesa 2 de móvil: de 7,1 a 13,8, y el abanico de m2 s25h de 12,9 a 17,0.

Es la causa (c) de la Fase 0: una métrica reescalada al canónico, sensible a la fase de píxel, que la ficha dejó fuera de las puertas. El porqué de la subida, en el §8.2.

---

## 4 · La voladora en tiempo real (§3.3)

**No hay ningún fotograma con la voladora sin pintar.**

**Cómo se midió:** un reparto completo de mesa 2 en escritorio (1920×1080, DPR 1), sin pausar nada. Los fotogramas son los del screencast de CDP (`Page.startScreencast`, cada fotograma compuesto) y un bucle de `requestAnimationFrame` anota dónde está cada `.flying-card`.

| | |
|---|---|
| Fotogramas capturados | 1 286 (1 285 casados con su rAF) |
| Fotogramas con alguna voladora | 255 |
| Voladoras distintas | 4 |
| Fotogramas con una voladora sin pintar | **0** |
| Vinotinto mínimo en el centro de una voladora | 1,00 (umbral de «pintada»: 0,80) |
| Primer fotograma de cada voladora | pintado en las cuatro (vinotinto 1,00) |

**El primer intento dio un falso positivo, y así se corrigió.** Casar cada fotograma con «el último rAF anterior a su hora» dio 3 de 4 voladoras «sin pintar» en su primer fotograma, todas a 2–3 ms del rAF. En esos fotogramas se veía sólo el mazo. Pero el fotograma con hora de pantalla justo después de un rAF es el **anterior**: la presentación va un frame por detrás. Para casarlos sin adivinar, cada rAF pinta ahora su número (módulo 16) en una sonda de 24 px en la esquina, y cada fotograma se casa con el rAF cuyo número lleva impreso. Con eso las cuatro voladoras salen pintadas desde su primer fotograma, que llega 30–38 ms después del rAF que la vio nacer.

**Lo que la Fase 0 vio en su §J-3** (voladora con caja y sin pintura, congelada en «reparto») no aparece en tiempo real. Era un efecto de congelarla antes de su primer pintado.

- **Evidencia:** `capturas-rev/fase1b/vuelo/` guarda el primer fotograma de las tres primeras voladoras.
- **Lo que no cubre:** es una sola corrida en Edge de escritorio. El iPhone sigue siendo la prueba visual final.

---

## 5 · Consumidores de `PlayingCard` fuera de la mesa

**Ninguno.** El único importador de `PlayingCard` en `src/` y `scripts/` es `GameTable.jsx:4`. Sus 18 usos (`GameTable.jsx:1583–1641`, más los que llegan a `OpponentPanel` como `render prop`) pintan dentro de `.game-table-screen`. No hay ningún caso de proporción rara que reportar antes de seguir.

Fuera de la mesa, el reverso sale de dos imports propios que **no cambian**:

- `Portada.jsx:10` (`reverso_carta.svg`);
- `SalaEspera.jsx:3` (`reverso_carta.svg?no-inline`).

La puerta 5 lo mide.

---

## 6 · Nota 8 del Sistema de Diseño

Añadida al final del §12 de `docs/AJILEI_Sistema_Diseno_v1.2.md`, sin renumerar nada. Recoge:

- por qué existe la copia de mesa;
- la regla de la copia (sólo se ensancha la tela; el original sigue en la Portada y la sala de espera);
- el procedimiento de regeneración del §2.1, paso a paso;
- dónde entra (el import y `rev.css`, con su especificidad);
- las dos correcciones a la nota 2 (§J-1): el tercer consumidor `<img>` en `SalaEspera.jsx:3`, y que la 1080 es el abanico.

---

## 7 · Comprobaciones finales (§3.6)

| Comprobación | Resultado |
|---|---|
| Pruebas (`vitest run scripts/ src/`) | **993/993** en 35 archivos |
| Lint (`eslint .`) | 20 errores y 1 aviso: **la línea base**, ninguno nuevo. Los de `GameTable.jsx` son los `react-hooks` de siempre |
| `gate` | **6/6** (640×360, 360×640, 844×390, 1024×768, 1366×768, 1920×937) |
| Modo `luz` completo | **VERDE**: 20 celdas + 4 tapetes, `p1_delta` ✓ `p2_contraste` ✓ `p3_estados` ✓ `p4_fugas` ✓ `p5_token` ✓, las seis fugas con 0 diferencias |
| Build | Limpio. `dist/assets/reverso_carta_mesa-Be9HJvqX.svg` (7,50 kB), con hash y aparte, junto a `reverso_carta-DpY1CyS5.svg` (6,99 kB) |
| Protegidos | Intactos. `git diff` sólo toca `PlayingCard.jsx`, `GameTable.jsx`, `diagDSK.mjs` y el Sistema de Diseño |
| `git status` | Los archivos del §1.2 (`PlayingCard.jsx`, `GameTable.jsx`, `diagDSK.mjs`, el Sistema de Diseño; nuevos `rev.css`, `reverso_carta_mesa.svg` y este informe), más `capturas-rev/` y los residuos conocidos (`MOT-1`, `laminas/mon1/`, `scripts/_cel1bFila.mjs`, el informe de la Fase 0) |

`gate` y `luz` corrieron con la integración ya hecha, contra el servidor 5173 con bypass y la Portada en 5174.

---

## 8 · Desviaciones y hallazgos

### 8.1 La puerta 4 necesitó tres correcciones de instrumento

La ficha fija la vara: «Δ contra el SVG en uso rasterizado solo a su propia caja ≤ 12 a DPR 3». La primera pasada la hizo con el laboratorio de la Fase 0: un `<div>` sin borde, en `left: 10px` y con `background` para todos los lugares. Salió **roja en 7 lugares**, todos mazos y abanicos de 27×42, con valores de 12,2 a 15,1.

Una sonda (`capturas-rev/fase1b/_lab.mjs`) aisló tres causas. Las tres son del instrumento y ninguna del dibujo:

| Causa | Prueba | Corrección |
|---|---|---|
| **El borde de la caja** mueve la fase de la imagen intermedia. Con el original coincide por casualidad; con la copia, no | Mazo de m2 360: laboratorio sin borde 11,3; con su borde de 2 px y radio 8 px, **0,10**. El color de fondo no influye (0,10 con él y sin él) | El laboratorio lleva el borde, el radio y el color computados de la caja |
| **La fase de subpíxel:** mazos en x = 127,5 y 216,30 | m2 s25h: 12,81 en posición entera, **0,05** en su fase. m5 s25h: 12,61 → **0,09**. Control m2 360, que ya estaba en posición entera: 0,13 → 0,12 | El laboratorio se coloca en la misma fracción de píxel que la caja real |
| **La capa compuesta:** el abanico, con su animación pausada, vive en su propia capa, que se ajusta a la rejilla de dispositivo | Abanico de m2 s25h: 14,79 sin capa, **0,15** con `will-change: transform` | Si el elemento tiene animaciones, el laboratorio también va en capa |

Además, las cartas pasan por un laboratorio `<img>` con su `object-fit`, dentro de un `.card-back` con su borde. Es su ruta real, como encontró la vara 3 de la 1a.

**Las tres correcciones reproducen la caja propia con más fidelidad; ninguna toca el umbral de 12.** Con ellas la puerta sale verde con margen: los lugares quietos dan 0,05–3,31 y la voladora, en pleno vuelo, 3,2–10,5. Si el rector prefiere la vara literal de la Fase 0, la puerta 4 queda roja en esos 7 lugares, con la sonda como prueba de que el dibujo es exacto.

### 8.2 La copia pinta ~⅓ de px CSS desplazada en las cajas pequeñas con borde

Es la otra cara del §8.1. A 27×42 con borde, el original y la copia caen en fases de píxel distintas: el dibujo es el mismo, pero desplazado un píxel de dispositivo (⅓ de px CSS a DPR 3). No se ve.

Es lo que sube el Δ informativo contra el canónico en los mazos de móvil de mesa 2 (7,1 → 13,8). Es de la misma familia que las dos cajas de la vara 3 de la 1a que el rector ya aceptó.

### 8.3 El modo `rev` necesitó excluir la voladora de `transition: none`

`luz` inyecta `transition: none` sobre todo (`*`). Aquí no se puede: la voladora se retira en su `transitionend` (`GameTable.jsx:292`), así que cancelarle la transición congela el reparto. La hoja del arnés es `*:not(.flying-card)`.

La voladora sólo transiciona `transform`, así que encender y apagar `rev.css` no le arranca ninguna transición. La puerta 1 lo confirma.

### 8.4 La oclusión sólo tiene caso en 2 de las 10 celdas

La prueba sabida de la ficha (el mazo bajo la voladora en «reparto») sólo se da en m5 pc y m2 pc. En las otras ocho, en el instante congelado la voladora ya salió del mazo.

En esas dos celdas, el mazo sale tapado (1/1 y 1/1). La corrida completa exige al menos un caso para dar verde; una parcial sin caso reporta «—».

### 8.5 Otros hallazgos

- **Todas las cartas de la IA de mesa 5 salen «tapadas» por intersección:** el solape de −0,35 hace que cada carta cubra un 40 % de la anterior, y las ranuras vacías (`.card-empty`, que sí pinta un fondo y un borde discontinuo) cubren a la última. Es correcto, pero deja a la IA de mesa 5 **sin recorte limpio** para la puerta 4. Su dibujo queda cubierto por la IA `.ai-zone` y la `opp-panel` de m2 s25h, que es la misma ruta `<img>` (0,05–0,19). La Fase 0 la recortaba con `elementFromPoint`, que no veía la ranura vacía.
- **`luz` completo tarda ~11 min** (20 celdas + 4 tapetes + fugas). Corrió en paralelo con la primera pasada de `rev`, sin interferencias.
- **`genMesa.mjs` vive en `capturas-rev/fase1a/`,** que no va a git. La nota 8 escribe el procedimiento entero para no depender de él. La ficha de commits decide si se muda a `scripts/`.
- **La Portada (`.pue-carta`) sigue con el recorte (b),** fuera de alcance según la ficha. Anotada para después.
- **`og-image.jpg` y `mesa*.webp`** llevan el reverso rasterizado de hoy. Con la copia, los mazos y las cartas apaisadas cambian un poco (Fase 0 §J-9).
- **Line endings:** el primer empalme del modo en `diagDSK.mjs` lo escribió Python con CRLF. Se devolvió a LF antes de medir: 0 `\r` en el archivo, igual que en `HEAD`.

---

## 9 · Tiempo real

| Parte | Inicio → fin | Tiempo |
|---|---|---|
| 1a | 17:47:38 → 17:54:33 | ~7 min (tope 30) |
| 1b | 20:38:54 → 21:22 | ~43 min (tope 90) |

---

### Comandos

```
node scripts/diagDSK.mjs rev                                  # 10 celdas × 4 estados, DPR 3, + fuera + voladora en tiempo real
REV_DPR=1 REV_SUF=_dpr1 node scripts/diagDSK.mjs rev 2 pc      # el caso de Victor a DPR 1
node capturas-rev/fase1b/hoja.mjs                              # hoja hoy | después
node scripts/diagDSK.mjs gate                                 # 6/6
node scripts/diagDSK.mjs luz                                  # completo: 20 celdas + 4 tapetes + fugas
```
