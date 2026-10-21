# AJILEI · TAB-1 · Fase 1a · La lámina · Informe v1.0

- **Para:** el rector · **Decisor:** Victor · **De:** Claude Code
- **Base:** `main` en `9fef917`. Lámina: sin cambios en `src/`, sin commits, sin `db push`.
- **Fecha:** 2026-10-19 · **Tiempo:** de 16:21 a 17:23 de reloj (62 min, dentro del tope de 150).
- **Lámina:** `laminas/tab1/` (sin seguimiento). Se abre con `npx vite --port 5174 --strictPort` → `http://localhost:5174/laminas/tab1/lamina.html` (§8).
- **Instrumento:** la lámina pinta la app real (`/src/main.jsx`) con la propuesta inyectada. Las cifras salen de `guion.js` (`medir()`) en cada panel. `capturar.mjs` las repite con Playwright: con puntero táctil en celular y tableta, en Chromium 151. Los paneles clave de tableta se repitieron en WebKit 26.5.
- **Estado:** STOP. No se continúa a la 1b.

---

## 1. Resumen para Victor

1. **La lámina está lista.** Ábrela y empieza por el **Grupo 2 (tableta vertical)**. Cada recuadro es el juego de verdad, al tamaño de esa pantalla, y abajo lleva sus cifras.
2. **Tu iPad mini con la app instalada tiene un área útil de 744×1100.** Lo saqué de tus 6 fotos: 45 puntos y un error medio de 1,7 px. Es el tamaño principal de la lámina.
3. **El celular no cambia nada.** Comparé píxel a píxel 25 pantallas de teléfono, hoy y con la propuesta: 0 píxeles distintos.
4. **En la tableta recomiendo A**, la mesa del teléfono ampliada ×1,3:
   - la carta pasa de 18,5 a **24 mm**;
   - en ángulo se ve igual que en tu S25 (antes, al 77 %);
   - la frase pasa de 13 a 17 px;
   - los botones pasan de 40 a 52 px.
5. **B**, los asientos alrededor del óvalo, sí se pudo maquetar, pero sale más pequeña (carta de 21,5 mm). Además deja un tercio de la mesa vacío.
6. **El óvalo gigante de las mesas 2 y 3 se arregla solo con A.** Al crecer, todo lo demás ocupa su sitio y el óvalo baja de casi la mitad de la pantalla a un tercio, como en el teléfono. El tope que pidió el rector queda como seguro, pero en tus tamaños no llega a actuar.
7. **Laptop: tengo que corregir un dato de la Fase 0.**
   - Con ×0,92 todos los botones y el pie se ven, pero la pantalla aún desplaza 36 px.
   - Con ×0,874 cabe todo, pero la letra más pequeña baja a 8,7 px.
   - Las dos opciones están en la lámina para que elijas.
8. **Escritorio:** en 1920×1080 el tope 1,3 y el 1,5 dan lo mismo, porque manda el alto. Solo se distinguen en pantallas más altas.
9. **Dos cosas que la versión de verdad tendrá que corregir**, ya medidas:
   - las cartas que vuelan al repartir caerían fuera de su sitio;
   - el globo de la frase larga se saldría de la pantalla.

   En la lámina ya están arregladas.

---

## 2. El patrón del teléfono (S25 412×915, mesas 2–5)

Medido con `capturar.mjs patron` en contexto táctil (`ref/patron.json`). Las cuatro proporciones (§4 de la ficha):
- **P-óvalo:** alto del óvalo / alto de la mesa.
- **P-hueco:** tapete vacío entre la cabecera y la zona del jugador, descontando rivales y óvalo / alto de la mesa.
- **P-carta:** alto de la carta del jugador / alto de la mesa.
- **P-frase:** letra de la frase / alto de la carta.

| Mesa | Estado | P-óvalo | P-hueco | P-carta | P-frase | Óvalo (px) | Mesa (px) | Carta (px) |
|---|---|---|---|---|---|---|---|---|
| 2 | reposo | 0,3799 | 0,0133 | 0,1195 | 0,1210 | 341,5 | 899 | 107,4 |
| 2 | turno / entre | 0,3799 | 0,0133 | 0,1172 | 0,1233 | 341,5 | 899 | 105,4 |
| 3 | reposo | 0,3697 | 0,0595 | 0,1194 | 0,1210 | 332,5 | 899,4 | 107,4 |
| 3 | turno / entre | 0,3697 | 0,0595 | 0,1172 | 0,1233 | 332,5 | 899,4 | 105,4 |
| 4 | reposo | 0,1324 | 0,1659 | 0,1195 | 0,1210 | 119 | 899 | 107,4 |
| 4 | turno / entre | 0,1324 | 0,1659 | 0,1172 | 0,1233 | 119 | 899 | 105,4 |
| 5 | reposo | 0,1324 | 0,1783 | 0,1195 | 0,1210 | 119 | 899 | 107,4 |
| 5 | turno / entre | 0,1324 | 0,1783 | 0,1172 | 0,1233 | 119 | 899 | 105,4 |

En reposo la carta mide 2 px más, porque el hueco vacío está más alto que la carta jugada. El resto no cambia entre estados.

**Cómo se calcula el semáforo de cada panel:** |valor − patrón| / patrón. Verde hasta 20 %, ámbar hasta 35 %, rojo por encima. **Excepción provisional:** en P-hueco, si el patrón es menor que 0,05 (mesas 2 y 3), se divide entre 0,05. Sin esa excepción, un solo píxel de tapete ya sale rojo (pregunta 3).

---

## 3. Las cifras de los paneles

Todas las filas están en `laminas/tab1/ref/paneles.csv` y `paneles.json`: 168 filas y 0 errores. Ahí está cada grupo, tamaño, mesa, estado y columna, con su factor, la carta en px y mm, el ángulo frente al S25, la frase, el botón, la zona táctil con dedo, las cuatro P con su semáforo, la ocupación, si cabe y lo que queda fuera. El Grupo 1 está en `ref/grupo1.json`.

Abreviaturas de este informe:
- **A×f:** variante A, la mesa del teléfono ampliada por el factor f.
- **Ab:** A con bandas de tapete a los lados.
- **As:** A sin tope de óvalo.
- **Táctil:** zona táctil más pequeña, medida con dedo.
- **Ángulo:** tamaño angular de la carta frente al S25. Las distancias son supuestas: 30 cm el teléfono, 40 la tableta, 55 la laptop y 65 el monitor.

### 3.0 · Calibración de la app instalada (§3 de la ficha)

Son 6 fotos de 1050×1600: mesas 2, 3 y 4, cada una en reposo y en turno. 1 px CSS equivale a 1,411 px de foto.

**Anclas detectadas por color**, todas en `scratchpad\tab1a\anclas.py`:
- los dos bordes del óvalo;
- la carta del jugador;
- «Apostar» o «Iniciar mano»;
- la moneda del saldo;
- los tres puntos de ⋮.

Son 45 puntos en total. Cada alto candidato se emuló en **WebKit 26.5**, en las mesas 2, 3 y 4 y en los dos estados. El origen vertical se ajustó por mínimos cuadrados.

| Alto útil | Origen y | Error cuadrático medio (px) | Peor | Vara ±3 % |
|---|---|---|---|---|
| 744×1047 (Safari con barras) | 67,5 | 24,40 | **3,82 %** | **ROJO** (control) |
| 744×1072 | 51,5 | 13,24 | 2,25 % | pasa |
| 744×1090 | 40,1 | 5,32 | 1,16 % | pasa |
| **744×1100** | **33,7** | **1,74** | **0,56 %** | **pasa (el mejor)** |
| 744×1105 | 30,5 | 2,35 | 0,39 % | pasa |
| 744×1109 (la cifra orientativa de la ficha) | 28,0 | 3,85 | 0,62 % | pasa |
| 744×1133 (pantalla entera, origen ajustado) | 12,7 | 14,31 | 1,95 % | pasa |
| 744×1133 desde y = 0 (la app debajo de la barra de estado) | 0 | — | **3,08 %** | **ROJO** |

**Resultado.**
- **El área útil es 744×1100**: empieza en y ≈ 33,7 y llega al borde inferior de la pantalla, que mide 1133,7.
- La vara del ±3 % deja pasar todo lo que va de 1072 a 1133, así que no basta para separar 1100 de 1109.
- **Lo que decide es el óvalo elástico de las mesas 2 y 3**, que es `100svh − estático` sin más:

  | | Mesa 3 | Mesa 2 |
  |---|---|---|
  | Foto | 518,1 px CSS | 527,3 px CSS |
  | Emulación a 1100 | 517,5 | 526,5 |
  | Emulación a 1109 | 526,5 | 535,5 |

**Residuos a 1100**, en px CSS: todos los puntos quedan en ±1,5, salvo dos.
- El borde superior del óvalo de la mesa 2 da −6,2: el borde de la `.ai-zone` queda pegado y la detección lo confunde.
- La x de ⋮ da +2,8: es la fuente del sistema, ya vista en la Fase 0.

**Control rojo.** La misma vara, con el alto de Safari (1047), sale **ROJA (3,82 %)**. La hipótesis de que la app ocupa la pantalla entera desde y = 0 también sale ROJA (3,08 %); el ancla que la delata es la cabecera, 33 px más baja en la foto. **La calibración pasa.**

### 3.1 · Grupo 1 · Control celular

| Tamaños | Mesas | Estados | Pares | Píxeles comparados | Distintos | Ruido de control | Atributos escritos |
|---|---|---|---|---|---|---|---|
| 360×640, 390×844, 412×915, 915×412 (y 412×915 a densidad 3) | 5 y 2 | reposo, turno, entre | **25** | 11 273 940 | **0 en los 25** | 0 en los 25 | **ninguno**: clase «celular» en los 25 |

**Cómo se hace** (`capturar.mjs g1`):
1. La página arranca **sin** las hojas de la propuesta (`limpio=1`) y se hace la foto A.
2. Se encienden `escala.css` y `variantes.css` y se corre la clasificación real (`clasificar` + `aplicarEscala`, con el puntero táctil del contexto). Foto B.
3. Se vuelven a apagar las hojas. Foto C.
4. A frente a B es la prueba. A frente a C mide el ruido.

**Dos trampas resueltas por el camino:**
- **El brillo infinito `turnBreath`** daba hasta 36 000 px de «diferencia» en turno, también entre A y C. Ahora todas las animaciones se detienen en su instante 0 antes de cada foto.
- **Entre manos, las fichas de las IAS** se movían unos segundos más: daban ruido en `.opp-corner-chip`. Se espera 6 s.

Con las dos, **los 25 pares salen IDÉNTICOS al primer intento**, con ruido 0. La frontera técnica funciona: el celular no recibe atributo.

### 3.2 · Grupo 2 · Tableta vertical (el principal)

**744×1100, app instalada, en turno.** Las cifras de reposo y de entre manos están en el CSV. «As» solo existe en las mesas 2 y 3.

| Mesa | Columna | f | Carta J | Ángulo | Frase | Botón | Táctil | P-óvalo | P-hueco | P-carta | P-frase | Cabe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | hoy | 1 | 119 px · 18,5 mm | 0,77× | 13,0 | 40 | 40 ✗ | 🟠 0,486 | 🟢 0,011 | 🟢 0,110 | 🟢 0,109 | sí |
| 2 | **A** | 1,301 | 154 · **24,0 mm** | **0,99×** | **16,9** | **52** | 51,8 | 🟢 0,328 | 🟢 0,016 | 🟠 0,143 | 🟢 0,110 | sí |
| 2 | Ab | 1,301 | 151 · 23,5 | 0,98× | 16,9 | 52 | 51,8 | 🟢 0,328 | 🟢 0,016 | 🟢 0,140 | 🟢 0,112 | sí |
| 2 | As | 1,301 | 154 · 24,0 | 0,99× | 16,9 | 52 | 51,8 | 🟢 0,328 | 🟢 0,015 | 🟠 0,143 | 🟢 0,110 | sí |
| 2 | B | 1,163 | 138 · 21,5 | 0,89× | 15,1 | 46,5 | 46,2 | 🔴 0,128 | 🔴 0,286 | 🟢 0,128 | 🟢 0,110 | sí |
| 3 | hoy | 1 | 119 · 18,5 | 0,77× | 13,0 | 40 | 40 ✗ | 🟠 0,477 | 🟢 0,049 | 🟢 0,110 | 🟢 0,109 | sí |
| 3 | **A** | 1,301 | 154 · 24,0 | 0,99× | 16,9 | 52 | 51,8 | 🟢 0,317 | 🟢 0,066 | 🟠 0,143 | 🟢 0,110 | sí |
| 3 | Ab | 1,301 | 151 · 23,5 | 0,98× | 16,9 | 52 | 51,8 | 🟢 0,317 | 🟢 0,066 | 🟢 0,140 | 🟢 0,112 | sí |
| 3 | As | 1,301 | 154 · 24,0 | 0,99× | 16,9 | 52 | 51,8 | 🟢 0,317 | 🟢 0,066 | 🟠 0,143 | 🟢 0,110 | sí |
| 3 | B | 1,163 | 138 · 21,5 | 0,89× | 15,1 | 46,5 | 46,2 | 🔴 0,128 | 🔴 0,497 | 🟢 0,128 | 🟢 0,110 | sí |
| 4 | hoy | 1 | 119 · 18,5 | 0,77× | 13,0 | 40 | 40 ✗ | 🟢 0,110 | 🔴 0,293 | 🟢 0,110 | 🟢 0,109 | sí |
| 4 | **A** | 1,301 | 154 · 24,0 | 0,99× | 16,9 | 52 | 51,8 | 🟢 0,143 | 🔴 0,054 | 🟠 0,143 | 🟢 0,110 | sí |
| 4 | Ab | 1,301 | 151 · 23,5 | 0,98× | 16,9 | 52 | 51,8 | 🟢 0,143 | 🔴 0,054 | 🟢 0,140 | 🟢 0,112 | sí |
| 4 | B | 1,163 | 138 · 21,5 | 0,89× | 15,1 | 46,5 | 46,2 | 🟢 0,128 | 🔴 0,364 | 🟢 0,128 | 🟢 0,110 | sí |
| 5 | hoy | 1 | 119 · 18,5 | 0,77× | 13,0 | 40 | 40 ✗ | 🟢 0,110 | 🔴 0,305 | 🟢 0,110 | 🟢 0,109 | sí |
| 5 | **A** | 1,301 | 154 · 24,0 | 0,99× | 16,9 | 52 | 51,8 | 🟢 0,143 | 🔴 0,093 | 🟠 0,143 | 🟢 0,110 | sí |
| 5 | Ab | 1,301 | 151 · 23,5 | 0,98× | 16,9 | 52 | 51,8 | 🟢 0,143 | 🔴 0,093 | 🟢 0,140 | 🟢 0,112 | sí |
| 5 | B | 1,163 | 138 · 21,5 | 0,89× | 15,1 | 46,5 | 46,2 | 🟢 0,128 | 🔴 0,385 | 🟢 0,128 | 🟢 0,110 | sí |

**Los otros tamaños, en turno.** A y B, en las mesas 2 a 5:

| Tamaño | f A | Carta A | Ángulo A | Frase A | f B | Carta B | Hoy (traje) |
|---|---|---|---|---|---|---|---|
| 744×1047 (Safari) | 1,301 | 24,0 mm | 0,99× | 16,9 | 1,163 | 21,5 mm | A del teléfono, 18,5 mm, táctil 40 |
| 834×1108 (iPad 11", sup.) | 1,376 | 31,3 mm | 1,30× | 17,9 | 1,303 | 29,7 mm | **D**, 27,7 mm, botón 33, táctil 28 |
| 1024×1259 (iPad Pro 13", sup.) | 1,564 | 35,5 mm | 1,47× | 20,3 | 1,564 | 35,5 mm | **D**, 27,7 mm, botón 33, táctil 28 |

**Lectura del Grupo 2:**
- **A cabe en todos los tamaños y mesas.** La excepción es la mesa 5 cuando manda el alto (744×1047, 834×1108 y 1024×1259): ahí desplaza **3–4 px**. La referencia de alto 805 de la Fase 0 se queda corta. Con 810 queda 1 px, así que propongo **≥ 812** para la 1b, que deja f(744×1047) ≈ 1,29.
- **El tope del óvalo no actúa con A×f** en ninguno de los cuatro tamaños: «As» da las mismas cifras que A, ±0,001. El factor ya llena el alto, así que el óvalo elástico se queda en 0,28–0,33 de la mesa, por debajo del tope: 0,44 en la mesa 3 y 0,46 en la mesa 2 (P-óvalo del S25 × 1,2).
- **Los síntomas de tus fotos se corrigen así:**
  - el óvalo de las mesas 2 y 3 baja de **0,486 a 0,328**: de ámbar a verde;
  - el hueco de las mesas 4 y 5 baja de **0,29–0,31 a 0,05–0,09**.

  Ese hueco sale ahora **rojo por defecto**: la mesa queda más justa que en el teléfono (0,17–0,18). Visualmente no se ve apretada (pregunta 3).
- **B** está maquetada de verdad en las cuatro mesas:
  - **Disposición:** la mesa 5 lleva IA3 e IA2 arriba, e IA4 | óvalo | IA1 en medio. La mesa 4, IA2 arriba. La mesa 3, IA2 | óvalo | IA1. La mesa 2, el rival arriba y la píldora en medio.
  - **Factor:** lo limita el **ancho**. La fila «IA | óvalo | IA» necesita 640 px propios, así que f = 744/640 = **1,16**.
  - **Hueco:** sobra alto. P-hueco sale de 0,29 a 0,50, en rojo en las 24 filas.
  - **Óvalo:** el de las mesas 2 y 3 se queda en una píldora de 119 px propios. P-óvalo da 0,13 frente a 0,37–0,38 del teléfono, en rojo.
  - **Frase:** en la mesa 5 a 744 se parte en tres líneas, «A las 2 — / Tú / abre.», porque el óvalo central mide 344 px.
- **Bandas (Ab):** misma carta (−3 px) y misma letra, con 92 px de tapete a cada lado (ocupación 0,74). Es una cuestión de gusto, no de cabida.
- **WebKit 26.5 confirma A, Ab y B** a 744×1100 (mesas 5, 2 y 3): la carta mide 153,95 frente a 153,84 px en Chromium, las P coinciden hasta el tercer decimal y todo cabe.

### 3.3 · Grupo 3 · Laptop

| Tamaño | Mesa | Columna | f | Carta J | Frase | Botón | Cabe |
|---|---|---|---|---|---|---|---|
| 1366×623 | 5 | hoy | 1 | 133 px · 35,2 mm | 14 | 33 | **no**: desplaza 90; «Siguiente mano» +34, Recargar +35, pie +43, zona +68 |
| 1366×623 | 5 | **×0,92** | 0,920 | 122 · 32,4 | 12,9 | 30,5 | **no**: desplaza **36**; todo control y el pie se ven; zona del jugador +13 |
| 1366×623 | 5 | ×0,874 (extra) | 0,874 | 116 · 30,8 | 12,2 | 27,7 | **sí**, desplaza 0 |
| 1366×623 | 2 | hoy / ×0,92 / ×0,874 | 1 / 0,92 / 0,874 | 133 / 122 / 116 | 14 / 12,9 / 12,2 | | no (57) / no (**2**) / sí |
| 1366×633 | 5 | hoy / ×0,935 / ×0,888 | | 133 / 124 / 118 | | | no (80) / no (34; zona +12) / sí |
| 1366×633 | 2 | hoy / ×0,935 / ×0,888 | | | | | no (47) / **sí** / sí |

**Corrección a la Fase 0 (TF-6).** Allí se escribió que ×0,92 cabía «sin desplazar». No es así: los propios datos de aquel prototipo (`exp3_chromium.json`, L0.92) ya daban `desplaza pantalla: 36`. Aquel «cabe» solo comprobaba los controles y el pie.

La mesa 5 en C necesita **713 px propios** para no desplazar nada (697 de mesa + 16 de pantalla), no 677. 677 es el alto en que **los controles** quedan a la vista. Por eso la columna «×0,874» (623/713) se añadió como extra. Lo mismo vale para el iPad horizontal (§3.4).

### 3.4 · Grupo 4 · iPad horizontal

| Tamaño | Mesa | Columna | f | Carta J | Ángulo | Táctil | Cabe | Bajo la banda |
|---|---|---|---|---|---|---|---|---|
| 1133×658 | 5 | hoy | 1 | 133 · 20,7 mm | 0,86× | 40 | **no** (55; pie +8, zona +33) | — |
| 1133×658 | 5 | propuesta | 0,972 | 129 · 20,1 | 0,83× | 38,3 | **no** (35; zona +13) | — |
| 1133×658 | 5 | aire quitado | 1,000 | 133 · 20,7 | 0,86× | 40 | sí | — |
| 1133×716 en pantalla completa | 5 | hoy | 1 | 133 · 20,7 | 0,86× | 40 | sí | **6 px** de la zona bajo la banda |
| 1133×716 en pantalla completa | 5 | propuesta (R-7) | 1 | 133 · 20,7 | 0,86× | 40 | **no** (33) | 3 px |
| 1133×716 en pantalla completa | 5 | aire quitado (R-7) | **1,05** | 140 · 21,8 | 0,90× | 41,2 | sí | 0 |
| 1133×658 y 716 | 2 | hoy / propuesta / aire | | | | | 658: no (22) / sí / sí; 716: sí / sí / sí | 6 / 0 / 0 |

**Lectura del Grupo 4:**
- **Con la fórmula sellada** (`H/677`), la propuesta deja la mesa 5 desplazando en los dos tamaños, porque 677 es el alto de «controles a la vista», no el de «todo cabe». Con la referencia 713:
  - 658 → **0,923**: medido, cabe;
  - 716 en pantalla completa, con la reserva de R-7 → **≈0,955**: con 0,965 aún desplaza 7 px.
- **«Aire quitado»** (los ≈58 px de T4.6, solo en esta lámina) da **×1,0 a 658** y **×1,05 a 716** en pantalla completa: +5 % de carta (de 20,7 a 21,8 mm).
- **La reserva de R-7 funciona:**
  - con «aire quitado» a ×1,05 no queda nada bajo la banda;
  - **la ✕ deja de tapar el logotipo**. Medido en la mesa 5: hoy el logotipo ocupa x 51–126 y la ✕ x 21–78, así que se pisan; con R-7 se corre a x 115–190. En la mesa 2 no se tocaban nunca.

  Para que la mesa entera quede por encima de la banda a f ≈ 1 hay que llegar a f ≈ 0,955 o quitar aire.

### 3.5 · Grupo 5 · Escritorio

| Tamaño | Mesa | Columna | f | Carta J | Ángulo frente al S25 | Frase | Ocupación |
|---|---|---|---|---|---|---|---|
| 1920×1080 (24") | 5 | hoy | 1 | 163 px · 45,0 mm | 1,15× | 14 | 0,43 |
| 1920×1080 | 5 | tope 1,3 **=** tope 1,5 | **1,30** | 212 · 58,5 | 1,49× | 18,2 | 0,71 |
| 1920×1080 | 2 | hoy / 1,3 = 1,5 | 1 / 1,30 | 142 / 185 · 51,1 | 1,00× / 1,30× | 14 / 18,2 | 0,34 / 0,56 |
| 2560×1300 (27" QHD, sup.) | 5 | hoy | 1 | 163 · 38,0 | 0,97× | 14 | 0,27 |
| 2560×1300 | 5 | tope 1,3 | 1,30 | 212 · 49,4 | 1,26× | 18,2 | 0,46 |
| 2560×1300 | 5 | tope 1,5 | 1,50 | 244 · 57,0 | 1,45× | 21,0 | 0,61 |

**Lectura del Grupo 5:**
- En 1920×1080 los dos topes dan **el mismo factor (1,30)**, porque manda el alto: min(1920/1126, 1080/830) = 1,301. Solo se distinguen en pantallas de 1080 px de alto o más.
- **En horizontal, las P salen rojas en todas las columnas, también hoy** (Grupos 3–5). El traje de escritorio es otra maqueta, ancha y baja, y no se puede comparar con el teléfono vertical. El ×f uniforme conserva las proporciones de hoy (pregunta 3).

---

## 4. Preguntas para Victor (§6), con mi recomendación

1. **Tableta vertical: ¿A sin bandas, A con bandas o B?** Recomiendo **A sin bandas**.
   - Es la única que devuelve el **tamaño del teléfono** al iPad: 0,99× en ángulo, 24 mm de carta, frase de 17 px y botones de 52.
   - Cabe en las cuatro mesas y lleva el óvalo de las mesas 2 y 3 a la proporción del teléfono.
   - B queda limitada por el ancho (×1,16): carta un 10 % menor, mucho tapete vacío y el óvalo de las mesas 2 y 3 convertido en una píldora pequeña.
   - Las bandas son solo de gusto: la misma carta, con 92 px de tapete a los lados.
2. **Tope del óvalo en las mesas 2 y 3: ¿P-óvalo × 1,2, otro valor o sin tope? ¿Cómo se reparte lo que sobra?** Recomiendo **mantener ×1,2 como seguro**. Con A×f no actúa en ningún tamaño medido; solo actuaría si el factor llegara a su máximo de 1,6 en una pantalla muy alta. Lo que sobre, **centrar el bloque**. Hoy las dos maneras dan lo mismo, porque no sobra nada.
3. **Tolerancias del patrón: ¿±20 % / ±35 % o cifras distintas?** Recomiendo:
   - **Mantener ±20 / ±35 solo en la tableta vertical.** Allí comparar con el teléfono tiene sentido.
   - **P-hueco con un suelo absoluto de 0,05**, como ya hace la lámina.
   - **P-hueco como «no menos de la mitad»** en vez de un ± simétrico: A en las mesas 4 y 5 sale rojo por estar *más justa* que el teléfono, y a la vista está bien.
   - **En horizontal, sin semáforo de P.** Ahí se juzga por cabida, letra mínima y ángulo.
4. **Laptop: ¿×0,92 aprobado?** Recomiendo **cambiar la referencia de 677 a 713 y bajar el piso a 0,87**: 1366×623 → ×0,874, todo cabe y no desplaza.
   - **El coste:** «Mano #N» y las insignias quedan en 8,7 px, frente al piso de 9 que se fijó. La frase queda en 12,2–13,1 px.
   - **Mírala en el panel «×0,874» antes de decidir.**
   - **Si prefieres el piso de 9:** ×0,92 deja ver todos los controles y el pie, pero desplaza 36 px en las mesas 4 y 5 (el borde de la zona del jugador queda cortado).
   - **La tercera vía**, piso de 0,9 quitando ≈20 px de aire en C, abre el bloque protegido.
5. **iPad horizontal: ¿f ≈ 1, o merece la pena abrir C para quitar aire?** Recomiendo **no abrir C**: quitar aire solo da +5 % de carta (×1,05 a pantalla completa). Pero sí aplicar la **referencia 713** de la pregunta 4: 658 → ×0,923, cabe (medido); 716 en pantalla completa con R-7 → ≈ ×0,955. Con eso nada desplaza y nada queda bajo la banda.
6. **Tope de escritorio: ¿1,3 o 1,5?** Recomiendo **1,3**.
   - En 1920×1080 los dos son iguales, y ×1,3 ya da 1,49× el ángulo del S25 en la mesa 5.
   - En 2560×1300, 1,3 deja la carta en 1,26× y 1,5 la sube a 1,45×. Pasar del tamaño del teléfono no aporta.

---

## 5. Lo anotado (§7)

| Punto | Medido | Requisito para la 1c |
|---|---|---|
| **Cartas en vuelo bajo `zoom`** | `FlyingCard` (`GameTable.jsx:279-300`, con origen y destino en `:718-745`, `:1421`, `:1439` y `:619-620`) escribe `left/top/width/height` y un `translate` con cajas **visuales**, y dentro de `#root` ampliado se multiplican. **Sin corregir:** a ×1,3, error de 131 px de media (219 máximo) y carta 1,34–1,38× más grande; laptop a ×0,92, 51 px. **Con la corrección de la lámina** (dividir entre f cada propiedad cuando React la escribe): **0 px** de error en la tableta (mesas 5 y 2) y en la laptop. La primera versión dividía dos veces (al llegar el `translate` volvía a dividir `left/top`) y se corrigió | Convertir las cajas a px propios (`/ f`) al crear el vuelo. Prueba: el modo `vuelos` con f ≠ 1 |
| **Globo de VOZ-2 bajo `zoom`** | **Sin corregir:** en la tableta ×1,3 se sale de la ventana (centro a 1,67 del alto del óvalo, ancho 1,3×). En escritorio ×1,3 se va a la esquina del óvalo (0,98 / 1,06). **Corregido en la lámina** (`left/top/width` entre f): centrado, 0,50 / 0,54 en la tableta y 0,50 / 0,52 en escritorio, y dentro de la ventana. El resto de 0,04 en y viene de que `colocaCapa` mezcla la caja visual del óvalo con el `offsetHeight` propio de la capa | En `Voz2Capa.jsx:37-46`, pasar el óvalo y la ventana a px propios antes de `colocaCapa`, no dividir solo la salida |
| **Cambio de clase en caliente** | Con un panel de tableta vivo (`puntero=tactil`, sin congelar) se jugó una mano y se giró. 744×1100 → 1100×744 → 744×1100, con la segunda vuelta en pleno reparto. Resultado: tableta ×1,301 → horizontal ×1 → tableta ×1,301, **cabe sin desplazar en los tres** y sin errores de página. Un vuelo lanzado justo antes del giro cae a 69,6 px de su sitio, **exactamente igual en la app de hoy** (control sin propuesta): ya existe hoy y no lo introduce el `zoom` | Ninguno nuevo |
| **Zonas táctiles en tableta (con dedo)** | Vertical: A 51,8 (744), 54,7 (834) y 62,5 (1024); B 46,2–51,8. **Las dos ≥ 44.** Hoy, 40 (A, 744) y **28** (D, ≥768). Horizontal: hoy 40, propuesta 38,3 (658, f 0,972) y 40 (716), aire 41,2: **por debajo de 44 en todas**, también hoy. Es el piso de 40 de PAN-1 1b en C táctil | Si la tableta horizontal debe llegar a 44: zonas de `tactil.css` (no protegido) a 44/f bajo `[data-escala="h"]` con puntero táctil |
| **La pantalla completa la pide «Iniciar mano»** | `reentrarPantallaCompleta` (PAN-1 1c) entra en pantalla completa en el contexto táctil de Playwright, **también en vertical**. Con la primera versión, la reserva de R-7 (pensada para la banda horizontal) se activaba en vertical y desplazaba la mesa 29 px | La reserva de R-7 va solo en horizontal (`@media (orientation: landscape)`), como ya está en `escala.css`. La lámina anula `requestFullscreen` y simula la pantalla completa con `fs=1` |
| **La puerta de A** | Simulada en memoria (matchMedia y CSSOM): **13 reglas en 7 hojas**. Protegidas, solo **4 líneas**: `gameTable.css:1114`, `:1130` y `:1165`, y `opponentPanel.css:645`. Son 3 + 1, no 2 + 2 como decía la Fase 0. La `:5537` ya está dentro de C. No protegidas: `theme.css:120`, `voz2.css:72,170`, `tactil.css:26,66`, `celebracion.css:242,322`, `embellecimiento.css:517`, y el espejo JSX `GameTable.jsx:110` | La 1d lleva esta lista |

---

## 6. Varas (§8)

| Vara | Esperado | Obtenido |
|---|---|---|
| vitest | 1.617 verdes | **1.617 passed** (69 ficheros) |
| lint | 21 | **21** (20 errores y 1 aviso, código 1, como la línea base; ninguno en `laminas/`: `npx eslint laminas/tab1` da 0) |
| build | correcto | **correcto** (código 0) |
| `diagDSK tam` | VERDE | **VERDE**: tam.1–tam.12 ✓, 448 puntos, 273 celdas, aislamiento verde, código 0 |
| `diagDSK retar` | 6/6 | **6/6**, código 0 |
| `diagDSK webkit` | verde | **VERDE** (WebKit 26.5): 20 celdas que cuentan y 10 con LIMITACIÓN, código 0 |
| Grupo 1 | 0 px distintos en todos los pares | **0 en los 25**, con ruido 0 y sin atributos escritos (§3.1) |
| Calibración de la app instalada | ±3 %, con el control rojo en rojo | **744×1100: 0,56 %** (45 puntos, error cuadrático medio de 1,7 px). Control 1047: **3,82 %, ROJO** (§3.0) |
| Protegidos | huella final = inicial | **iguales las seis** (§7) |
| `git status` | lo de antes + el informe de la Fase 0 + `laminas/tab1/` + este informe | **sí** (§7); `git diff` vacío |

---

## 7. Cierre

- **Procesos:** el servidor de la lámina (vite 5174, PID 54340) se cerró por PID al terminar. Comprobado a las 17:22: **ningún `node` vivo**, y los puertos 4173, 4191, 4192, 5173 y 5174 **libres**. Victor lo vuelve a abrir con las instrucciones del §8.
- **Protegidos** (`git hash-object`):

| Archivo | Inicio | Final |
|---|---|---|
| `src/engine/gameEngine.js` | `21c4d3f56318…` | igual |
| `src/engine/aiPlayer.js` | `8cfc3736cba2…` | igual |
| `src/engine/deck.js` | `eb61426083ca…` | igual |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8…` | igual |
| `src/styles/opponentPanel.css` | `3ce6383eec0d…` | igual |
| `src/styles/gameTable.css` | `1e21371c8543…` | igual |

- **`laminas/tab1/`** (sin seguimiento):
  - **La lámina:** `lamina.html`, `lamina.css`, `lamina.js` y `grupos.js` (la configuración, compartida con `capturar.mjs`).
  - **El panel:** `pantalla.html` (la app real), `pre.js` (semilla, silencio y puerta de A simulada) y `guion.js` (ruta a la mesa, estado, congelado, medida, correcciones de VOZ-2 y vuelos, banda y ✕).
  - **Borradores de la 1b/1c**, con comentarios: `escala.js` (núcleo `clasificar` + `aplicarEscala`) y `escala.css` (zoom en `#root`, gemelas de las 9 reglas de ventana, tope del óvalo y R-7).
  - **Solo de lámina:** `variantes.css` (bandas, B, reparto y aire quitado).
  - **Medida:** `capturar.mjs`.
  - **`ref/`:**
    - `t3_matriz.csv`, copiado de la Fase 0 e idéntico byte a byte (`cmp`);
    - `patron.json`;
    - `grupo1.json`;
    - `paneles.json` y `paneles.csv`.
- **Scratchpad** (`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\41ec08d5-bbc4-419c-b53a-2523ef593265\scratchpad\tab1a\`; Victor lo borra a mano):
  - **Calibración:** `calib.json`, `calib_webkit.json` / `.log`, `anclas.py`, `anclas_foto.json`, `ajuste.py`, `ajuste_out.json` y `ajuste.log`.
  - **Sondas:** `ver.mjs`, `verw.mjs`, `dbg.mjs`, `lam.mjs`, `ruido.mjs`, `s7.mjs` y sus salidas `s7*.out`, y `resumen.py` / `resumen.md`.
  - **Planes:** `casos1–5.json`.
  - **Registros:** las varas en `vara_*.log` y `varas.txt`, `paneles*.log` y `vite5174.log`.
  - **Imágenes:** `p_hoy4.png`, `a13_*.png`, `a13t_*.png`, `b_*.png`, `bb_*.png`, `a_1024_4.png`, `hoy_1024_4.png`, `l_*.png`, `d_*.png`, `i_*.png` y `lam_g*.png`.
- **Otros efectos:**
  - **`dist/`:** lo recompilaron `npm run build` y los modos `tam`/`webkit`; está ignorado por git.
  - **`localStorage` del origen 5174:** la lámina escribe `ajilei.sound = off` (silencio) y `tab1.*` (la pestaña elegida). El origen 5173 de `diagDSK` no se toca.
- **`git status` final** (17:21; `git diff` vacío):

```
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? docs/reportes/AJILEI_TAB-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_TAB-1_Fase1a_Lamina_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? laminas/tab1/
```

**No se continúa a la 1b.** El rector y Victor deciden con la lámina.

---

## 8. Instrucciones para Victor (para pegar)

```
Cómo abrir la lámina de TAB-1 (la mesa según el tamaño)

1. En una terminal, dentro de la carpeta del proyecto (ajilei):
       npx vite --port 5174 --strictPort
2. En Chrome abre:
       http://localhost:5174/laminas/tab1/lamina.html
3. Empieza por la pestaña «2 · Tableta vertical ★».
   Arriba eliges tamaño (744×1100 es tu iPad con la app instalada), mesa y estado.
   Cada recuadro tarda unos segundos en llegar a la mesa; en «en turno»
   y «entre manos» juega solo hasta llegar ahí y luego se queda quieto.
   «ver a tamaño real ↗» abre ese recuadro 1:1 en una ventana propia.
4. Luego mira los grupos 3 (laptop), 4 (iPad horizontal) y 5 (escritorio).
   El grupo 1 (celular) solo confirma que el teléfono queda igual: sello IDÉNTICO.
5. Para cerrarla: en la terminal, Ctrl+C.

Lo que tienes que elegir está en el informe, §4 (seis preguntas).
```
