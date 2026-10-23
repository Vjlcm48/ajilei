# AJILEI · TAB-2 · Fase 2a · Lámina · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Base:** `main` = `origin/main` = `abc2ebc`
**Tipo:** lámina de comparación. Sin cambios en `src/` y sin commits. **STOP.**
**Lámina:** `laminas/tab2/` (sin seguimiento) · **Medidas:** `vite preview` (4191, `--strictPort`) del `dist/` de `abc2ebc`, con Chromium 151 del arnés · **Reloj:** 15:10 → 15:30 según `date`.

---

## 1. Resumen para Victor

1. **Los bordes ya se llenan, sin costura y sin que tu mesa se mueva.** Las dos versiones de M2b (b, estirada, y c, acotada) dejan **0 px de franja** en los tres tamaños, con los tres tapetes. No dejan costura y la mesa queda donde estaba: a lo sumo un cuarto o medio píxel, que no se ve.
2. **La diferencia entre b y c es de gusto.** La b aclara los lados, porque el degradado se estira a toda la pantalla. La c deja el centro exactamente como hoy y oscurece hacia los bordes con la filigrana. Mírala en tu monitor con la vista real: es la prueba que cuenta.
3. **En las ventanas bajas (R-2) ninguna opción cumple todo.**
   - **C×f** (escritorio reducido) se ve como la versión de escritorio, pero la frase se queda en 9,7–11,8 px y las cartas encogen un 25–35 %.
   - **B′ a 12 px** cumple la vara de la frase, pero la frase más larga de la crónica («La IA sube a 1000. ¿Qué haces?») ocupa **tres líneas y se sale del óvalo** en las mesas de 4 y 5.
   - **B′ a 10 px** es el tamaño mayor en que todo queda dentro. No cambia nada más de la mesa y no toca ningún archivo protegido, pero no llega a la vara de 12.
4. **El celular no se entera:** con todas las variantes puestas, sus 16 casos dan la misma geometría al byte y 0 píxeles distintos. La frontera con doble llave deja a todos los teléfonos donde están (también el caso trampa de 1.030 px y el teléfono con ratón) y a los iPad en ventana en B, como hoy.
5. **Encontré y corregí en la lámina un detalle de M2b:** el borde invisible de 1 px de la jaula dejaba ≈1,3 px de franja oscura a cada lado. La Fase 0 no lo vio porque su sonda empezaba a mirar en x = 1,5. M2b ahora quita ese borde y compensa el relleno.

---

## 2. Arranque

| Comprobación | Resultado |
|---|---|
| `HEAD` / `origin/main` | `abc2ebc55f16…` ✓ |
| `git status` al empezar | solo sin seguimiento ajenos (MOT-1 × 2, `laminas/mon1/` × 3) y el informe de la Fase 0 |
| Protegidos (lista de `docs/AJILEI_Protegidos_v1.0.md` §2, versión vigente v1.7) | SHA-256 al empezar = los de la Fase 0 = §3 de la v1.7 ✓ |
| Antecedente | `AJILEI_TAB-2_Fase0_Informe_v1.0.md`, leído; las sondas de la Fase 0 se **copiaron** (no movieron) a `sonda2.mjs` |
| `ref9fef\` y su unión | **no se tocaron** |

---

## 3. Grupo 1 · Los bordes

**Cómo se midió.** Hay una página por (tamaño, mesa, tapete). En la misma página, con las animaciones en su instante 0, se miden las cuatro variantes inyectadas una tras otra como `<style>` propio.
- **Franja:** px seguidos que pintan `html`/`body`/`#root` desde cada borde (barrido desde x = 0,25 y W − 0,75, en tres alturas).
- **Costura:** diferencia de luz a ±4 px del antiguo borde de `#root`, en 9 alturas. Se da la mediana, que separa un escalón de verdad del cruce suelto de una línea de filigrana, y el máximo.
- **Deriva:** la mayor diferencia de las cajas de la mesa (marco, óvalo, cabecera, jugador, pozo, frase, rivales, cartas y botones) frente a (a).
- **Borde exterior:** el color del píxel (1, H/2).

**Resultados** (56 paneles: 1366×623, 1920×929 y 3440×1290 × mesas 2 y 5 × verde y tricolor, más vinotinto a 1920×929):

| | Franja por lado | Costura (mediana · máx.) | Deriva de la mesa | Borde exterior (verde · tricolor · vinotinto) |
|---|---|---|---|---|
| **a · Hoy** | 191 · 330 · 988 px | **escalón** de 3,8–15,9 · hasta 21,5 | 0 | `#09170e` liso · `#0c131c` · `#1b080d` |
| **b · M2b estirado** | **0** en las 14 páginas | ≤ 1,7 · ≤ 6,3 | ≤ 0,02 en la mesa de 2; ≤ 0,58 en la de 5 (subpíxel con f ≠ 1) | `#0d2214`–`#0e2315` · `#111d2b` · `#2a0b14` |
| **c · M2b acotado** | **0** en las 14 | ≤ 1,0 · ≤ 7,0 | igual que b | `#0b1c11` · `#101b28` · `#210910` (más oscuro: es el `darkest` del tapete) |
| **d · M3 (descartada)** | el vacío lo pinta el `body` con **otro** tapete | **escalón** de 6,5–22,2 · hasta 27,8 | 0 | `#0d2214` · `#121c29` · `#2a0b14` |

Los máximos de 4–7 en b y c son cruces de una línea de filigrana con el punto de muestra: la mediana es ≤ 1,7. En d, el escalón está en **todas** las alturas. Recortes de la costura: `laminas/tab2/fotos/cost_<tamaño>_<a|b|c|d>.png`.

**Qué se ve** (fotos `g1_*`):
- **b** ensancha el halo claro del centro: a 3440×1290 los lados quedan visiblemente más claros que la «pared» de hoy.
- **c** es indistinguible de hoy dentro de la antigua caja y, hacia fuera, se va al `darkest` del tapete con la filigrana encima. Es la que menos cambia la mesa que Victor ya conoce.
- En tricolor, las dos llevan las bandas hasta el borde. En c, la viñeta queda del tamaño de hoy.
- **El detalle del borde de 1 px (corregido).** `#root` tiene `border-inline: 1px` transparente (`index.css:62`). Al soltar la jaula, ese px (×f) dejaba ver el `body` a cada lado: la vista real a 1920×1080 leía «franja 1 px». M2b añade `border-inline: 0`. Para que las ventanas de menos de 1.126 propios no ganen esos 2 px de ancho (lo medí: la mesa de 5 se ensanchaba 2 px a 1093×498), el relleno mínimo pasa de 20 a 21 px. Con eso la deriva vuelve a 0 en todas las celdas. Las cifras de arriba son de después de la corrección.

**CSS de cada variante** (`laminas/tab2/variantes.js`, todo bajo `html[data-escala="h"]`, para `escala.css`):

```css
/* b · M2b */
html[data-escala="h"] #root { width: auto; max-width: none; margin: 0; border-inline: 0; }
html[data-escala="h"] .game-table-screen { padding-inline: max(21px, calc((100% - 1124px) / 2 + 20px)); }
/* c · lo anterior + el radial con su tamaño de hoy (hypot del medio ancho de 1124 y el medio alto) */
html[data-escala="h"] .game-table-screen { background: var(--filigrana), radial-gradient(circle hypot(562px, calc(50dvh / var(--escala))) at center, var(--green-base) 0%, var(--green-deep) 55%, var(--green-darkest) 100%); }
html[data-escala="h"] body[data-tapete="tricolor"] .game-table-screen { /* filigrana + viñeta con el mismo radio + las bandas de tapetes.css:288-301 */ }
```

`hypot()` de CSS está en Chrome 120, Safari 15.4 y Firefox 118.

---

## 4. Grupo 2 · R-2, las ventanas bajas

### 4.1 Cifras (en turno, contextos con ratón: `hover`, `fine`)

| Ventana · mesa | B · hoy | C×f (f = alto/715) | B′ 12 | B′ 10 |
|---|---|---|---|---|
| 1280×577 · m5 | frase **9** · carta 101×143 · franja 77 | f 0,806 · frase 11,28 · carta 76×107 · franja 0 | frase **12** · franja 0 | frase 10 · franja 0 |
| 1280×577 · m2 | frase 12 · carta 101×143 · franja 77 | frase 11,28 · carta 76×107 | 12 | 12 |
| 1242×566 · m5 | 9 · 101×143 · 58 | f 0,791 · 11,07 · 74×105 | 12 | 10 |
| 1242×566 · m2 | 12 · 101×143 · 58 | 11,07 · 74×105 | 12 | 12 |
| 1093×498 · m5 | 9 · 101×143 · 0 | f 0,696 · **9,74** · 66×93 | 12 | 10 |
| 1093×498 · m2 | 12 · 101×143 · 0 | 9,74 · 66×93 | 12 | 12 |
| 1024×600 · m5 | 9 · 101×143 · 0 | f 0,839 · 11,75 · 79×112 | 12 | 10 |
| 1024×600 · m2 | 12 · 101×143 · 0 | 11,75 · 79×112 | 12 | 12 |

En todas las celdas:
- **Desplaza:** 0 en las cuatro variantes.
- **Etiquetas pequeñas** (MANO / TURNO / P / Mano #N): 10 px en todas.
- **Rótulo del pozo y nota del comodín** (no son de la vara de etiquetas, pero son letra pequeña): en B miden **8 / 8** en la mesa de 5 (`gameTable.css:2716, 2728`), y en C×f entre 7,0 y 9,2.
- **Tocable más bajo:** en B y B′, la ✕ de la mesa de 5 mide 15×19 (con ratón no aplica el piso táctil de 40); en C×f, de 28×20 a 34×23.
- **Franja:** C×f y B′ tienen 0, porque llevan M2b (C×f con `h`; B′ con su versión `hb`).
- **C×f** reescribió **20 reglas** `@media` en cada corrida (el recuento obligatorio; nunca 0).

### 4.2 B′: el diseño

1. **La regla de los 9 px:** `gameTable.css:2721-2723`, **protegida**:
   ```css
   .table-wide .game-message, .table-four .game-message, .table-three .game-message { font-size: 9px; height: 16px; }   /* 12/22 → ~9/16 */
   ```
   Está dentro de la media de B (`:2397`) y vale también para la **mesa de 3**.
2. **Cómo agrandarla sin que el celular lea nada nuevo:** con un atributo propio de la mesa, `data-escala="hb"`, que escribiría `useEscalaMesa` solo con la doble llave (horizontal, alto ≤ 600, ancho ≥ 1.024, `hover: hover` y `pointer: fine`), con **f = 1**. La regla nueva va en `escala.css` y gana por especificidad (0,4,1 frente a 0,2,0), sin tocar el protegido:
   ```css
   html[data-escala="hb"] .game-table-screen :is(.table-wide, .table-four, .table-three) .game-message { font-size: 12px; /* o 10px */ }
   ```
   - **Lo que cuesta el atributo con f = 1:** las reglas generales de `escala.css` (`zoom`, `min-height`, `height: calc(100dvh / 1)`, las gemelas de `.vc-ajilei` y `.cel-gota`) dan el mismo valor que hoy. **Medido: atributo + bordes = 0,00 px de deriva** en las 8 celdas.
   - **Los bordes de B′:** sí, M2b también los cubre, en su versión `hb`, porque el relleno lateral de B es `var(--ls-screen-padx)` y no 20:
     ```css
     html[data-escala="hb"] #root { width: auto; max-width: none; margin: 0; border-inline: 0; }
     html[data-escala="hb"] .game-table-screen { padding-inline: max(calc(var(--ls-screen-padx) + 1px), calc((100% - 1124px) / 2 + var(--ls-screen-padx))); }
     ```
     Franja de 77 y 58 → 0, con 0 px de deriva.
3. **O1, medido en 36 celdas** (1280×577, 1024×600 y 1093×498 × mesas 5, 4 y 3 × reposo / turno con TURNO y cronómetro / resultado / resultado recortado con «…»), con la frase a 9, 10, 11 y 12:
   - **la caja del óvalo y la fila del óvalo (`.table-mid`) son idénticas al byte** en las 36 celdas y los cuatro tamaños, porque la caja de la frase tiene alto fijo (16 px);
   - **pero el texto rebasa su caja.** Ya lo hace hoy, a 9 px, en el resultado («IA 1 gana con Oros, 41 pts.» en 113×16). Con el resultado y el recorte de VOZ-2 (2 líneas como máximo), a 12 px todo queda dentro de la píldora del óvalo (`o1_1280x577_m5_*_12.jpg`).
   - **La crónica de apuestas no tiene ese recorte** (modo `cronica`, 4 frases × 2 tamaños × mesas 5 y 4):

   | Frase | 9 px | 10 px | 11 px | 12 px |
   |---|---|---|---|---|
   | «La IA sube a 1000. ¿Qué haces?» | 2 líneas, dentro | 2, dentro | 2, dentro | **3, se sale 4,5 px arriba y 2,9 abajo** |
   | «La IA apuesta 1000. ¿Qué haces?» (mesa 4) | 2, dentro | 2, dentro | **3, se sale 1,5** | **3, se sale 4,5** |
   | «Vas all-in con 12500 HC.» | 2, dentro | 2, dentro | 2, dentro | 2, dentro |
   | «A las 3 — IA 4 abre.» | 1, dentro | 2, dentro | 2, dentro | 2, dentro |

   **Veredicto:** B′ a 12 px **no es viable tal cual**. El óvalo no crece, pero la crónica larga se sale de él en las mesas de 4 y 5. **El mayor tamaño que lo cumple siempre es 10 px** (0 de 16 casos fuera). La lámina enseña los dos, B′ 12 y B′ 10.
4. **Líneas que tocaría B′ en el código:**
   - **Protegidas: ninguna.**
   - No protegidas:
     - `src/lib/escala.js`: `clasificar` (nueva clase con atributo `hb`), `ventanaDe` (leer `(hover: hover) and (pointer: fine)`), `enganchaEscala` (escuchar el cambio de esa media) y la tabla de la cabecera;
     - `src/lib/escala.test.js`;
     - `src/styles/escala.css`: 3 reglas, las dos de los bordes `hb` y la de la frase;
     - el arnés: `scripts/tab/tab.mjs`.

   Los comentarios desfasados de `gameTable.css` (decisión 6) van aparte.

### 4.3 C×f, si se eligiera

Necesita **las 4 líneas protegidas** de la puerta de C, con la doble llave en vez del ancho solo.

| Archivo:línea | Texto con doble llave |
|---|---|
| `gameTable.css:1130` | `@media (min-width: 768px) and (min-height: 601px) and (orientation: landscape), (min-width: 1024px) and (orientation: landscape) and (hover: hover) and (pointer: fine) {` |
| `gameTable.css:4251` | `@media (orientation: landscape) and (min-height: 601px), (orientation: landscape) and (min-width: 1024px) and (hover: hover) and (pointer: fine) {` |
| `gameTable.css:2397` | `@media (orientation: landscape) and (max-height: 600px) and (max-width: 1023px), (orientation: landscape) and (max-height: 600px) and (hover: none), (orientation: landscape) and (max-height: 600px) and (pointer: coarse) {` |
| `opponentPanel.css:261` | igual que `:2397` |

El complemento de B se escribe como **lista de condiciones simples** y no con un `not (…)` anidado: si un navegador no entendiera esa sintaxis, la media entera fallaría, y con ella **el traje del teléfono acostado**. A esas cuatro líneas se suman las ≈ 20 hermanas no protegidas y los espejos JS de la Fase 0 §6.3, con la misma transformación, y `escala.js` con el factor sin suelo.

---

## 5. Grupo 3 · Controles

**1 · Celular intacto: VERDE.** Mesas 5 y 2 × reposo y turno en 412×915, 915×412, 390×844 y 360×640, contextos táctiles. En la misma página: cajas y foto sin variantes, y otra vez con **todas** inyectadas (M2b, el radial acotado, M2b `hb` y la frase de B′).
- **16/16 sin atributo.**
- **Geometría al byte idéntica:** de 68 a 152 cajas por celda.
- **0 píxeles distintos.**

**2 · La frontera con doble llave: VERDE.** Los valores de `hover` y `pointer` son los de la emulación de Chromium (táctil = `hover: none`, `pointer: coarse`).

| Caso | Ventana | `hover` · `fine` | Doble llave | Hoy | Con la doble llave |
|---|---|---|---|---|---|
| iPhone 16/17 Pro Max acostado | 956×402 | no · no | cerrada | celular | celular / B |
| iPhone 15 Plus / Pro Max | 932×390 | no · no | cerrada | celular | celular / B |
| Galaxy S25 Ultra | 891×370 | no · no | cerrada | celular | celular / B |
| Galaxy S25 (arnés) | 915×412 | no · no | cerrada | celular | celular / B |
| Xperia 1 | 960×411 | no · no | cerrada | celular | celular / B |
| Galaxy Z Flip 6 | 1006×411 | no · no | cerrada | celular | celular / B |
| Galaxy Z Fold 6 exterior | 905×369 | no · no | cerrada | celular | celular / B |
| **Trampa 1030×420 táctil** | 1030×420 | no · no | **cerrada** (puntero grueso) | celular | **celular / B** ✓ |
| **Teléfono con ratón** | 1006×411 | **sí · sí** | **cerrada** (no llega a 1.024) | celular | **celular / B** ✓ |
| Fold 6 interior | 823×707 | no · no | cerrada | `h` (no es celular hoy) | `h`, como hoy |
| iPad en ventana | 980×560 | no · no | cerrada | celular | **B, como hoy** ✓ |
| iPad en ventana | 1133×500 | no · no | cerrada | celular | **B, como hoy** ✓ |
| Laptop 1280×577 | — | sí · sí | **abre** | celular | sale (`hb` o C×f) ✓ |
| Laptop 1242×566 | — | sí · sí | abre | celular | sale ✓ |
| Laptop 1093×498 | — | sí · sí | abre | celular | sale ✓ |
| Netbook 1024×600 | — | sí · sí | abre | horizontal-b | sale ✓ |

Lo que la emulación no cubre: un **iPad con trackpad** (Magic Keyboard) podría informar `pointer: fine`. Si además mide ≥ 1.024 de ancho y ≤ 600 de alto, saldría de B. No es un teléfono, así que la meta («nunca atrapar un teléfono») sigue en pie; si importa, se verifica con el dispositivo.

**3 · Huellas y diff:** las seis huellas al terminar son **idénticas** a las del arranque; `git diff --stat` está vacío.

---

## 6. Preguntas al rector

1. **Bordes: ¿b o c?** Las dos cumplen lo medible: franja 0, costura de mediana ≤ 1,7 y deriva subpíxel. **Recomiendo c** (acotado): deja la mesa de hoy idéntica en el centro y solo llena los lados, sin aclarar el ultrapanorámico. Cuesta 2 reglas más y `hypot()`. Que decida el ojo de Victor en la vista real.
2. **R-2: ¿B, C×f, B′ 12 o B′ 10?** **Recomiendo B′ 10:**
   - no toca protegidos;
   - deja la geometría de B intacta (0 px), con sus cartas grandes;
   - sube la frase de 9 a 10 y llena los bordes;
   - O1 se cumple, y la crónica larga queda dentro del óvalo en todos los casos.

   Pero **no cumple la vara de 12**, y ninguna otra variante la cumple sin un coste: B′ 12 hace que el texto se salga del óvalo, y C×f queda en 9,7–11,8 y encoge las cartas. Para llegar a 12 en B′ habría dos caminos:
   - (i) recortar la crónica a 2 líneas con «…», que cambia lo que se lee;
   - (ii) ensanchar la caja de la frase en la rejilla del óvalo, que toca la maqueta y pide medir O1 otra vez.

   Pregunta concreta: **¿la vara de la frase para la clase `hb` es 10 (el suelo de las etiquetas) o se mantiene 12 y se abre (i) o (ii)?**
3. **Líneas protegidas por caso:**
   - bordes b o c: **ninguna**;
   - B′ (10 o 12): **ninguna**;
   - C×f: **4** (`gameTable.css` 1130, 2397 y 4251 y `opponentPanel.css` 261, solo condición, §4.3).

   En cualquier caso, los **comentarios** de la decisión 6: `gameTable.css:1127-1129` y `:1153-1164`, solo comentario.
4. **La mesa de 3 en B** también tiene la frase a 9 px (la misma regla). ¿B′ la incluye? **Recomiendo sí**: es la misma línea y no se sale del óvalo ni a 12 (su caja mide 222–236 de ancho).
5. **Letra pequeña de B en la mesa de 5:** el rótulo del pozo y la nota del comodín miden 8 px, por debajo del suelo de 10 de las etiquetas. Hoy no los mide ninguna vara. ¿Se suman a B′, o quedan anotados? **Recomiendo** anotarlos sin tocarlos en TAB-2, porque el pozo comparte fila con la frase y agrandarlo es otra medida de O1.
6. **iPad con trackpad:** ¿basta la emulación, o se verifica en un iPad real antes de sellar la doble llave? **Recomiendo** anotarlo como riesgo conocido. No afecta a los teléfonos.

---

## 7. Ajuste del plan 2b–2d

| Sub-tanda | Qué (con B′ y c, lo recomendado) | Vara | Estimación |
|---|---|---|---|
| **2b · Bordes** | `escala.css`: M2b (con `border-inline: 0` y 21 px) + radial acotado (2 reglas, verde y tricolor) | **V-borde:** franja 0 barriendo **desde x = 0,25 y W − 0,75** (la lección de esta fase: barrer desde 1,5 escondía 1,3 px); deriva ≤ 0,75 frente a sin M2b; costura de mediana ≤ 2 | 30 min |
| **2c · R-2 como B′** | `escala.js` (`hb` con la doble llave + oyente de `hover`/`pointer`), `escala.test.js`, `escala.css` (bordes `hb` + frase), comentarios §7 de la Fase 0 (rango autorizado), Protegidos v1.8 solo si se abren los comentarios | **V-hb:** las 4 ventanas × mesas 5, 4, 3 y 2 sin desplazar, frase ≥ la vara que se decida, O1 al byte y la **crónica dentro del óvalo** (las 4 frases del modo `cronica`), deriva 0 frente a B | 45 min |
| *(si C×f)* | + las 4 líneas protegidas + ≈ 20 hermanas + espejos JS | V-h ampliada a la clase baja | +45 min |
| **2d · Arnés** | `tab.mjs`: V-borde, V-hb y **V-frontera** (los 16 casos de §5.2, con la trampa y el teléfono con ratón); `diagDSK tab` completo y `tam`, `retar` y `webkit` en verde | — | 40 min + corridas (`tab` ≈ 15 min) |

---

## 8. Cierre

**En el proyecto, sin seguimiento:** `laminas/tab2/`:
- `index.html`, la lámina;
- `pantalla.html`, `pre.js` y `guion.js`, la app real en un iframe;
- `variantes.js`, el CSS de las variantes, en un solo sitio;
- `datos.js`, las cifras, generadas por la sonda;
- `fotos/`, 108 archivos (8,4 MB).

**En el scratchpad** (`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\d970e55e-5c62-4e74-a6db-a1fdf923456f\scratchpad\`):
- `sonda2.mjs` (modos `g1`, `g2`, `o1`, `cronica`, `cel`, `frontera`), `datos.cjs` y `probar_lamina.mjs` (la comprobación de la lámina contra el 5174);
- `s2_*.json` y `huellas_2a_ini.txt` / `huellas_2a_fin.txt`;
- `lam_*.png`, capturas de la lámina funcionando.

**⚠ Unión `node_modules` (de la Fase 0, intacta):** `…\scratchpad\ref9fef\node_modules` → `C:\Users\victo\OneDrive\Documents\ajilei\node_modules`. **Quítala con `rmdir` antes de borrar `ref9fef`.** Esta fase no creó uniones nuevas.

**Procesos y puertos:** `vite preview` (4191) y `vite` de desarrollo (5174, solo para comprobar la lámina) parados por su PID. **0 `node.exe` vivos**; 4173, 4191 y 5174 libres.

**Una nota sobre la comprobación.** La comprobación de la lámina contra el 5174 cortó toda petición no local. La app de desarrollo con bypass intentó **`rpc/mi_sala` contra el Supabase real**. Es lo que hace siempre tu servidor de desarrollo, no algo de la lámina, pero lo dejo dicho.

**`git status`:**
```
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md          (ajeno, de antes)
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md  (ajeno, de antes)
?? docs/reportes/AJILEI_TAB-2_Fase0_Informe_v1.0.md          (Fase 0)
?? docs/reportes/AJILEI_TAB-2_Fase2a_Lamina_Informe_v1.0.md  (este informe)
?? laminas/mon1/…                                             (ajeno, de antes)
?? laminas/tab2/                                              (la lámina)
```

---

## 9. Instrucciones para Victor

**Abrir la lámina** (PowerShell, desde la carpeta del proyecto):

```powershell
cd "C:\Users\victo\OneDrive\Documents\ajilei"
npx vite --port 5174 --strictPort
```

Cuando diga `Local: http://localhost:5174/`, abre en Chrome:

```
http://localhost:5174/laminas/tab2/
```

**Por dónde empezar (≈ 10 min): Grupo 1, en tu monitor.**
1. En la lámina, pulsa **F11** (Chrome a pantalla completa).
2. Pulsa **«▶ Vista real · Grupo 1»**. Es tu mesa real a tamaño real; tarda unos segundos en entrar.
3. Con la barra de abajo, alterna **a · Hoy**, **b · Estirado** y **c · Acotado**. El cambio es instantáneo. Mira:
   - los lados: ¿se llenan sin una línea donde antes acababa la mesa?;
   - el centro: ¿la mesa sigue igual?;
   - con cuál te quedas.
4. Cambia el **tapete** (Verde, Tricolor y Vinotinto) y la **mesa** (2 y 5). Esos dos recargan, unos segundos.
5. **H** oculta y muestra la barra; **Esc** cierra la vista real.
6. Si quieres, baja por la página: están las fotos de 1366×623 (tu laptop) y del ultrapanorámico, con su semáforo y un zoom a la costura.

**Después (≈ 10 min): Grupo 2.**
1. Pestaña **«Grupo 2»** → **«▶ Vista real · Grupo 2»**. La mesa se abre a 1280×577, como una laptop pequeña, y la mano arranca sola.
2. Alterna **B · hoy**, **B′ 12** y **B′ 10**, que cambian al instante, y **C×f**, que recarga. Mira:
   - la frase del óvalo: ¿se lee?;
   - el tamaño de las cartas;
   - si el conjunto te parece «de teléfono» o «de escritorio».

   Puedes jugar la mano: los botones funcionan.
3. Prueba las otras ventanas (1093×498 es la más baja).
4. Abajo, en la página, están las tablas de O1 y de la crónica: B′ 12 se sale del óvalo con «La IA sube a 1000. ¿Qué haces?».

**Grupo 3 (≈ 2 min):** es solo para leer. El celular queda intacto y la frontera hace lo esperado, todo en verde.

**Cerrar:** en PowerShell, **Ctrl+C**. Si pregunta «¿Desea terminar el trabajo por lotes (S/N)?», escribe **S** y pulsa Enter.
