# AJILEI · IDX-1 · Fase 1b · Informe v1.0

**Ficha:** `AJILEI_IDX-1_Fase1b_v1.0.md` (2026-09-25) · **Fecha:** 2026-09-25 · **Base:** `5311a32` (main) · sin commits · Edge 153.0.4234.48

---

## Resumen

- **El juego y la Portada ya sirven el índice nuevo.** Salen de los 40 PNG maestros pasando por IDX-1 en memoria, con los factores sellados. En el repositorio no hay ningún PNG con índice.
- **Los 40 WebP servidos son idénticos al byte a los de la hoja que Victor aprobó** (la franja «Nueva» de `capturas-idx/hoja.html`).
- **B-2:** las 40 pasan con el factor sellado, la más justa con 18,0 px, y la regla no habría dado otro factor en ninguna.
- **Peso:**
  - Baraja: 0,56 MB → **0,55 MB**, con el techo en 0,80.
  - Copas de la Portada: de 8,7 a 13,2 KB, con el techo en 25 KB.
- **Pantalla:**
  - 340 caras medidas en 5 tamaños, en mesa de 5 y de 2, incluida la revelación de todas las perdedoras.
  - **Ninguna tiene la esquina del número tapada.**
- **Reproducibilidad (§2.5): NO CUMPLE A-5 en una carta de tres corridas.** La causa está medida y hay una solución lista; ver §4 y la pregunta 1. Por la regla de la ficha he seguido el camino conservador: no he cambiado el rasterizado aprobado.

## 1 · Lo que se hizo

| Tarea | Qué cambió |
|---|---|
| 2.1 Núcleo | En `idxCore.mjs`: <ul><li>`FACTORES_SELLADOS`, una tabla congelada con las 40 cartas.</li><li>`factorSellado`.</li><li>`HOLGURA_TOLERADA = 17` y `comprobarHolgura`, que lanza por debajo de 17,0.</li><li>B-3 en `esRestoNumero`: `INTENSIDAD_RESTO = 6`; un píxel a menos de 6 niveles de la crema no cuenta.</li><li>`estadoCarta` usa 17 como umbral de «necesita decisión».</li></ul> |
| 2.1 Página | `idxPagina.mjs` aplica el factor **sellado** y dibuja la carta desde cero con ese factor. La búsqueda de la regla sigue corriendo, pero solo como dato (`factorRegla`, `reglaDifiere`). Los derivados se piden por generador: calidad fija, o techo en bytes con la misma bisección de la Portada. |
| Navegador compartido | Nuevo `scripts/idx/idxNavegador.mjs`, usado por los tres generadores. Abre la página IDX de siempre (origen ficticio y todo lo demás abortado) e incluye `motivosDeParada` (B-2 y restos) y `avisosDeRegla`. |
| 2.1.3 `gen-idx.mjs` | Usa la tabla sellada y el navegador compartido. Se detiene **antes de escribir** si una carta no pasa. Sigue siendo la herramienta de la hoja (B-6). |
| 2.2 `gen-cards.mjs` | Cada carta pasa por IDX y después se reduce a 320 px en WebP q80, como hasta ahora. <ul><li>Procesa **las 40 en memoria y escribe solo si pasan todas**, para no dejar media baraja vieja y media nueva.</li><li>Se para si los maestros no son exactamente las 40 cartas de IDX.</li><li>Conserva el techo de 0,80 MB y la verificación sobre lo escrito.</li></ul> |
| 2.3 `gen-portada-assets.mjs` | Las cinco copas pasan por IDX y conservan su techo de 25 KB y la bisección. Nuevo filtro por id: `node scripts/gen-portada-assets.mjs cartas` regenera **solo** las cinco. Así lo corrí, y `mesav`, `mesapc` y `og-image` quedan intactas. |
| Pruebas | `testIdxCore.test.js` pasa de 26 a **30 pruebas**: <ul><li>La tabla tiene las 40 y ninguna más.</li><li>Sus valores son los del informe del ajuste, con 31 unos, el 7 de copas a 1 y el 4 de oros en `monedas-0.84`.</li><li>La parada salta en 16,99, pasa en 17,0 y también se para con `NaN`.</li><li>Un píxel pálido de la mezcla, (244, 233, 213), ya no cuenta como resto; uno a 7 niveles, sí.</li></ul> |

## 2 · Comprobación B-2 en las 40 cartas

Con el factor sellado, **las 40 pasan** (≥ 17,0 px). En **ninguna** la regla habría dado otro factor en esta corrida: `reglaDifiere` sale falso en las 40, en `gen-idx`, `gen-cards` y `gen-portada-assets`.

| Carta | Factor sellado | Holgura final |
|---|---|---|
| 5 de copas | 0,93 | **18,0** px (la más justa; 1,0 px sobre la parada) |
| 7 de copas | 1 | **18,2** px |
| 4 de bastos | 0,91 | 18,7 |
| 5 de bastos | 0,91 | 19,0 |
| 7 de bastos | 0,96 | 19,9 |
| 5 de oros | 0,90 | 20,0 |
| 6 de oros | 1 | 21,0 |
| 6 de bastos | 0,96 | 21,6 |
| 4 de espadas | 0,90 | 22,5 |
| 4 de copas | 0,90 | 22,7 |
| 3 de bastos | 1 | 22,8 |
| 3 de espadas | 1 | 23,9 |
| 4 de oros | monedas 0,84 | 37,3 |
| Las otras 27 | 1 | de 26,0 a 376,2 |

**Resultado:** 31 ok y 9 encogidas, con 0 restos del número viejo en los 80 anillos (criterio B-3).

**Lo que Victor aprobó, intacto:** los 40 PNG que salen hoy de `gen-idx` son **idénticos al byte** a los del ajuste.

## 3 · Peso

| | Antes | Después | Techo |
|---|---|---|---|
| `src/assets/cards/webp/` (40) | 588 720 B (0,56 MB) | **572 272 B (0,55 MB)**, −2,8 % · de 7,4 a 27,3 KB por carta, 14,0 de media | 0,80 MB |

La baraja pesa un poco menos porque aplanar la crema quita el ruido del parche de fondo.

| Portada | Antes | Después | Techo | Calidad |
|---|---|---|---|---|
| `uno_copa.webp` | 11 632 B | **11 512 B** | 25 600 B | q0,92 |
| `tres_copa.webp` | 8 800 B | **8 742 B** | 25 600 B | q0,92 |
| `cinco_copa.webp` | 10 698 B | **9 746 B** | 25 600 B | q0,92 |
| `diez_copa.webp` | 11 272 B | **11 128 B** | 25 600 B | q0,92 |
| `doce_copa.webp` | 13 288 B | **13 152 B** | 25 600 B | q0,92 |

Todas entran con la calidad máxima (0,92), sin bisección.

## 4 · Reproducibilidad (§2.5, criterio A-5)

Comparé los **píxeles decodificados**, no los bytes, de tres corridas seguidas de `gen-cards.mjs` y dos de `gen-portada-assets.mjs`:

| Comparación | Iguales al byte | Diferencia máxima | A-5 |
|---|---|---|---|
| Portada, corrida 1 frente a 2 | 5/5 | 0/255 | **cumple** |
| Baraja, corrida 1 frente a 3 | 40/40 | 0/255 | cumple |
| Baraja, corrida 1 frente a 2 | 39/40 | **22/255** en `seis_basto` (28 435 canales) | **no cumple** |

**La causa, medida con sondas fuera del repositorio:**

1. **Todo lo anterior al número es determinista.** El hash del lienzo justo antes de pintarlo sale igual en 36 de 36 repeticiones, en tres sesiones.
2. **La variación está en el número, y solo en las 9 encogidas.** Al pintarlo, Edge le cambia ±1 o 2 niveles al borde de antialias, en 1 a 30 píxeles de la caja del número. En esas 9 cartas el `drawImage` escalado desde un lienzo acelerado deja el lienzo de trabajo en **GPU**, y el texto rasterizado por GPU no es determinista. En las otras 31 el número se rasteriza en CPU y sale igual siempre.
3. **El codificador WebP con pérdida amplifica ese ±1 a toda la imagen.** A 320 px el ±1 casi siempre desaparece, pero a veces cambia las decisiones del codificador. En `seis_basto` eso dio 22/255.
4. **Frecuencia:** en tres corridas completas del PNG, dos salieron idénticas a lo aprobado y una tuvo ±1 en dos cartas. En la baraja WebP, una corrida de tres salió distinta en una carta.

**Probé tres soluciones y descarté dos:**

- **`--disable-gpu`:** determinista (16/16 y 40/40), pero cambia 13 cartas frente a lo aprobado. En las 4 del «2» el glifo se desplaza (hasta 245/255 en 1 667 px) y en las 9 encogidas el dibujo se remuestrea distinto (hasta 220/255).
- **`textRendering` en sus tres modos:** no cambia nada.
- **Pintar el número en un lienzo CPU limpio:** determinista (una variante en 9 repeticiones), y el dibujo no cambia. Pero el número de las 9 encogidas se rasteriza distinto que en la hoja aprobada: hasta 120/255 en unos 1 600 px del borde del glifo. En el WebP servido eso da hasta 100/255, porque el codificador lo reparte por toda la carta. A la vista es el mismo número, pero ya no serían, al píxel, las cartas que Victor aprobó.

**Lo que decidí:** la ficha manda seguir por el camino más conservador, así que **no cambié el rasterizado**. Los 40 WebP servidos ahora son de la corrida 3, idéntica a la 1, y **son idénticos al byte a los de la hoja aprobada**. Dejé el hallazgo comentado en `idxPagina.mjs`, junto al pintado del número. La solución del lienzo CPU está medida y lista para aplicarla si el rector la aprueba (pregunta 1).

## 5 · Inventario de consumidores (§2.4)

| Vía | De dónde toma la cara |
|---|---|
| Juego, las tres vías de render: la mano (`.player-zone`), los rivales de las mesas 5/4/3 (`opp-panel`) y el rival de la mesa 2 (`.ai-zone`, o `opp-panel` en horizontal) | `CardImage.jsx`, el único constructor de la ruta, con `import.meta.glob('../assets/cards/webp/*.webp')` → **regeneradas** |
| Precarga de la baraja (`src/lib/precargaBaraja.js`) | `URLS_BARAJA`, el mismo glob de `CardImage` → **regeneradas** |
| Cartas decorativas de la Bienvenida (`WelcomeScreen.jsx:7-8`) | `cards/webp/doce_oro.webp` y `once_oro.webp` → **regeneradas** |
| Portada (`Portada.jsx:11-15`) | `assets/portada/{uno,tres,cinco,diez,doce}_copa.webp` → **regeneradas** |
| Portada, capturas `mesav` y `mesapc`, y `public/og-image.jpg` | Capturas de pantalla con la baraja vieja: **D-14, fuera de esta fase** |
| Dorso (`reverso_carta.svg`: `PlayingCard`, `SalaEspera`, `Portada` y `gameTable.css`) | No es una cara |
| Arnés (`diagDSK`, `rutaMesa` y los modos) | Lee las cartas por `alt`, que no cambia (B-5) |
| Pruebas y fixtures | Ninguna prueba ni fixture carga imágenes de carta |

**No hay ninguna vía imprevista.**

- **`src/assets/hero.png`:** es el resto de la plantilla de Vite, no se importa en ningún sitio y no es una carta.
- **Sin service worker** (Fase 0), así que no hay caché de caras viejas.
- **`CardImage.jsx` sin tocar:** mismos nombres; Vite da hash nuevo.

## 6 · En pantalla (§2.6)

- **`diagDSK gate` (5173): 6/6.**
- **Script efímero, fuera del repositorio:**
  - Usa `rutaMesa → irALaMesa` contra el servidor 5173 (con bypass), en Edge 153, con reto básico y apuesta 0.
  - Recorre 5 viewports: 360×640, 390×844, S25 vertical (412×915), S25 horizontal (915×412) y 1920×1080.
  - En mesa de 5 y de 2 mide tres momentos:
    - En juego, con las 5 caras en la mano.
    - En el showdown.
    - **Después de tocar el nombre de cada finalista** (D-15). En la mesa de 5 se ve una mano a la vez, así que se mide tras cada toque.
  - En la mesa de 2 el showdown ya enseña la mano del rival, gane o pierda, y no hay toque (el producto excluye la mesa 2 de «Revelar manos»).
- **La zona medida es la tinta real del número de cada carta** (de `informe.json`) ampliada 9 px, que es el contorno. Sobre ella hay una rejilla de 7×7 puntos y `elementFromPoint` en cada uno.

| | Mesa de 5 | Mesa de 2 |
|---|---|---|
| Manos de rival vistas por viewport | 3–4, la ganadora y todas las perdedoras | 1 |
| Caras medidas | 265 | 75 |

**Resultado: 340 caras, 16 660 puntos y 16 660 visibles.**

- **Ninguna cara tapada** y ningún punto fuera de la pantalla.
- Vías: mano 195, `opp-panel` 125 y `ai-zone` 20; 39 cartas distintas.
- **Lo servido es lo nuevo:** en las 10 mesas, los bytes que entrega el servidor para una cara coinciden con los del disco.
- **Tamaño de la zona del número en pantalla (tinta y contorno):**

  | Viewport | Alto de la zona |
  |---|---|
  | 360×640, mesa de 5 (la más pequeña) | desde 8,4 px |
  | S25 vertical | 9,9–16,2 px |
  | 1920×1080 | hasta 27,5 px |

Las capturas (40 PNG) están en `capturas-idx/pantalla-1b/`, que git ignora. También quedó allí una primera pasada incompleta en `capturas-idx/pantalla/`: medía una sola mano revelada y el reparto a medias en la mesa de 5, y la sustituye `pantalla-1b`. Revisé dos capturas a ojo (S25 vertical, mesa de 5, revelación de una perdedora; y S25 horizontal, mesa de 2, showdown): el número nuevo se lee en todas las caras.

## 7 · Línea base

| Qué | Cifra |
|---|---|
| `npm test` | **35 archivos · 993 pruebas · 993 aprobadas** (989 + 4 nuevas de B-1, B-2 y B-3) |
| `npx eslint .` | **21 problemas (20 errores, 1 aviso)**, la línea base. Los archivos tocados no tienen ninguno |
| Protegidos | Los seis blobs sin cambios: `21c4d3f56318` · `8cfc3736cba2` · `eb61426083ca` · `0d1bb8ea66a8` · `3ce6383eec0d` · `1e21371c8543` |

## 8 · Riesgos

1. **Reproducibilidad del WebP (§4).** Mientras no se decida la pregunta 1, volver a correr `gen-cards` puede cambiar al byte alguna de las 9 encogidas; se vio 1 carta en 3 corridas. Sería invisible, pero saldría en el diff del commit, y dos máquinas no tienen por qué producir los mismos bytes. **No afecta a lo que hay ahora en el árbol**, que es lo aprobado al byte.
2. **El 5 de copas queda a 1,0 px de la parada** (18,0 frente a 17,0). Si una versión de Edge baja el antialias más de 1 px, `gen-cards` se detendrá sin escribir. Es lo que pide B-2, pero conviene saber que la primera carta en saltar será esa.
3. **`gen-idx` ya no compara con «hoy».** La franja «Hoy» de la hoja lee `src/assets/cards/webp/`, que ahora contiene las cartas nuevas: «Hoy» y «Nueva» salen iguales. Como herramienta de revisión futura sirve para ver las nuevas, pero ya no enseña el antes y el después.
4. **D-14 sigue abierto:** `mesav`, `mesapc` y `og-image` enseñan la baraja vieja en la Portada y en la tarjeta social hasta su fase.

## 9 · Preguntas al rector

1. **¿Se aplica el pintado del número en un lienzo CPU limpio?** Haría deterministas las 40 cartas y cumpliría A-5 sin excepción. A cambio, el número de las 9 encogidas cambiaría en el borde del glifo (hasta 120/255 en el maestro y 100/255 en el WebP) frente a lo que Victor aprobó, y haría falta que Victor lo mirara en una hoja nueva. Si no, se acepta que esas 9 pueden variar al byte entre corridas y se commitea lo que hay, que es lo aprobado.
2. **Si se aplica la pregunta 1:** ¿se sellan también los hashes de los 40 derivados, para que un cambio de Edge se detecte en el commit y no en el teléfono?
3. **Hoja de contacto:** ¿se cambia la franja «Hoy» para que lea del último commit (`git show HEAD:…`) en vez del árbol, y así vuelva a enseñar el antes y el después?

## 10 · Estimación para la ficha de commits

**45–75 min de Claude Code:**

| Paso | Minutos |
|---|---|
| Si se aprueba la pregunta 1: aplicar el cambio, regenerar, tres corridas de comparación y hoja nueva para Victor | 30–45 (más su revisión) |
| Dividir en commits: <ul><li>el núcleo y las pruebas</li><li>los generadores y el navegador compartido</li><li>`scripts/fonts/` con la OFL</li><li>los 45 WebP</li><li>`.gitignore`</li><li>los cuatro informes de IDX-1</li></ul> | 15–20 |
| Build, `vite preview` y una pasada del arnés sobre el build | 10 |

---

**Confirmaciones:**

- **Sin commits.**
- **Protegidos intactos** (§7).
- **Sin dependencias nuevas.**
- **Maestros PNG, componentes, CSS, `mesav`, `mesapc`, `og-image` y Sistema de Diseño sin tocar.**
- **Escrituras, solo en lo permitido:**
  - `scripts/idx/`: `idxCore.mjs` e `idxPagina.mjs`, más el nuevo `idxNavegador.mjs`.
  - `scripts/gen-idx.mjs`, `scripts/gen-cards.mjs` y `scripts/gen-portada-assets.mjs`.
  - `scripts/testIdxCore.test.js`.
  - Las 40 de `src/assets/cards/webp/`.
  - Las cinco copas de `src/assets/portada/`.
  - Este informe.
  - Además, salida ignorada en `capturas-idx/` y `capturas-dsk/` (del `gate`).
- Las sondas, las copias de las corridas y el script de pantalla viven en la carpeta temporal de la sesión.

**STOP.** Victor prueba en sus teléfonos por el túnel de siempre (build → `vite preview --host` → `cloudflared`): mesa de 2 y de 5, en vertical y en horizontal, y la Portada. Después, la ficha de commits.
