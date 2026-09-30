# AJILEI · DIS-1 · Fase 1b · Render final, derivados web y lámina v1.2 · Informe · v1.0

**Ficha:** `AJILEI_DIS-1_Fase1b_Final_v1.0.md` · **Fecha:** 2026-09-30 · **Base:** `main` en `59fa46d`
**Ejecuta:** Claude Code

**Escrito:**
- `scripts/dis1/gen_dispositivos.py`, reemplazado por el adjunto (v3) sin editar. Comparado con la v2.2, el diff solo contiene lo que la ficha dice que añade la v3: la docstring, `WEB`, `--calidad-web`, `matriz_area`, `derivado_web` y el bloque `web` en `main` y en el `print`.
- `capturas-dis/final/`: la salida del render, `_log.txt` y `_comprob_1b.json` (medidas en bruto de §3).
- `capturas-dis/lamina12/`:
  - `lamina.html` (el adjunto `lamina_dis1_v1.2.html` sin editar);
  - `datos.js`, `laptop_web.webp` y `telefono_web.webp`, copiados de `final/`;
  - `sello_edge.png` y `sello_webkit.png`;
  - `_mapa_dif.png` y `_medidas_1b.json` (medidas en bruto de §4).
- Este informe.

Sin commits y sin `git add`. No se copió nada a `src/` ni se tocaron `maestras/`, `public/`, el arnés ni los protegidos. `git status` es el mismo que antes de la fase: `capturas-dis/` está ignorada y `scripts/dis1/` ya estaba sin seguimiento.

**Navegadores:** Edge 154.0.4258.37 y WebKit 26.5 (playwright-core 1.62.1). **Blender:** 4.5.10, Cycles en CPU.

> **Resumen:**
> - **El render final sale bien:** código 0 en **309,7 s**, unos 5 min, menos que los 10–15 estimados. Las 5 `comprobaciones` de los dos aparatos están en verde y los cuatro PNG son de 16 bits.
> - **La lámina v1.2 cumple la vara:** `error_px` de **0,02** en la laptop y **0,03** en el teléfono, **idéntico en Edge y en WebKit**, y 0 errores de consola. Con la captura horneada desaparece el defecto de la vuelta 4.
> - **Rojo 1, las rendijas del teléfono:** 250 px con alfa < 250 dentro del cuadrilátero. No es una rendija: todos están a menos de 17 px de sus esquinas, que **caen 0,41 mm fuera del cuerpo del teléfono** (§3.2). El borrador de la vuelta 3 ya daba 39.
> - **Rojo 2, las esquinas del WebP del teléfono:** las inferiores tienen alfa 1 y 3, no 0. Es la sombra real del render (alfa 2/255 en la esquina del recorte) cortada por el margen del 2 % (§3.3).
> - **Diferencia de píxeles entre Edge y WebKit:** **4,02 %** dentro de la columna. Pasa del 3 %, así que se adjunta el mapa. Está solo en los bordes con contraste; el fondo y las guías salen iguales.
> - **Peso de la escena 5:** pasa de 66 330 B a **75 600 B** (+14 %).

---

## 1. Render final

Orden, lanzada desde la raíz con un `timeout` de 40 min y cronometrada con `spawnSync` de Node:

```
"C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" -b --factory-startup --python scripts/dis1/gen_dispositivos.py -- --calidad final --salida capturas-dis/final --fondo "#1c4a2d"
```

Líneas del script, del log `capturas-dis/final/_log.txt`:

```
[DIS-1] laptop: 3200×2434 · hueco 158.07 s · captura 4.47 s · web 887×611 47816 B · comprobaciones OK
[DIS-1] telefono: 1566×2400 · hueco 57.78 s · captura 2.29 s · web 330×522 27784 B · comprobaciones OK
[DIS-1] listo
--- código 0 · señal null · error - · 15:57:53 → 16:03:03 · 309.7 s ---
```

**Código de salida: 0.** Tiempo total: **309,7 s** (15:57:53 → 16:03:03).

| `tiempos_s` | hueco | captura | web |
|---|---|---|---|
| laptop | 158,07 | 4,47 | **64,77** |
| teléfono | 57,78 | 2,29 | 14,13 |

**Nota sobre el derivado web:** en la laptop tarda 65 s, una cuarta parte de su tanda. La mayor parte se va, probablemente, en los bucles de Python de `matriz_area` (3 200 columnas). No afecta al resultado, pero sí a la actualización de 1–2 s prometida en §0, si esa actualización regenera también el WebP.

**Salida:** por aparato, `*_hueco.png` y `*_captura.png` (RGBA de **16 bits**, comprobado en la cabecera IHDR), `*_web.webp` y `*.json`; además, `datos.js` y `hoja.html`. Todo lo esperado.

## 2. `comprobaciones` y bloque `web` de cada JSON

### Comprobaciones

| | laptop | teléfono |
|---|---|---|
| `centro_hueco_transparente` | true | true |
| `centro_captura_opaco` | true | true |
| `bisel_opaco` | true | true |
| `esquinas_dentro_de_imagen` | true | true |
| `silueta_no_toca_borde` | true | true |

### Datos del render

| | laptop | teléfono |
|---|---|---|
| imagen | 3200 × 2434 | 1566 × 2400 |
| muestras | 512 | 512 |
| `silueta_opaca` | 341, 302, 2546, 1796 | 272, 190, 1005, 1956 |
| `tinta_con_sombra` | 189, 285, 2715, 1837 | 140, 178, 1263, 2045 |
| `px_por_metro` | 6 228,98 | 13 373,14 |

### Bloque `web`

| | laptop | teléfono |
|---|---|---|
| `archivo` | `laptop_web.webp` | `telefono_web.webp` |
| `tamano` | 887 × 611 | 330 × 522 |
| `bytes` | 47 816 | 27 784 |
| `calidad` | 85 | 85 |
| `escala` | 0,314138 | 0,24539 |
| `recorte_en_render` | 134,7 · 230,7 · 2823,6 · 1945,6 | 99,1 · 137,1 · 1344,8 · 2126,8 |
| `silueta_opaca` | 64,81 · 22,39 · 799,8 · 564,02 | 42,43 · 12,98 · 246,62 · 480,08 |
| `tinta_con_sombra` | 17,06 · 17,05 · 852,88 · 576,9 | 10,04 · 10,04 · 309,93 · 501,92 |
| `px_por_metro` | 1 956,759 | 3 281,63 |

Las siluetas cumplen el objetivo: **799,8 px de ancho** en la laptop (objetivo 800) y **480,08 px de alto** en el teléfono (objetivo 480).

## 3. Comprobaciones del render final (2.2)

**Método:** Edge con canvas. Los PNG se sirven por `page.route`, y el navegador los decodifica a 8 bits por canal.

| Prueba | laptop | teléfono |
|---|---|---|
| **1. Nada asoma:** asoman | **0** | **0** |
| exterior (validez > 50 %) | 4 513 705 px = **57,95 %**, válida | 1 950 865 px = **51,91 %**, válida |
| **2. Rendijas:** píxeles dentro del cuadrilátero | 1 707 343 | 1 613 051 |
| con alfa < 250 | **0** (mínimo 255) | **250** (mínimo 0) · **ROJO** |
| **3. Derivado web:** tamaño leído = `web.tamano` | 887 × 611 = 887 × 611 ✓ | 330 × 522 = 330 × 522 ✓ |
| alfa de las esquinas (TL, TR, BR, BL) | 0, 0, 0, 0 ✓ | 0, 0, **1**, **3** · **ROJO** |
| alfa del centro de `web.silueta_opaca` | 255 en (464, 304) ✓ | 255 en (165, 253) ✓ |

### 3.1 Cómo se midió

- **Nada asoma**, como la prueba 2.2 de la vuelta 3:
  - **exterior:** alfa < 128 en `*_hueco.png`, conectado con el borde (inundación desde los cuatro bordes);
  - **asoman:** los píxeles del exterior con alfa de `*_captura.png` mayor que el alfa del hueco + 10.

  La validez es la de la vuelta 4. El teléfono queda cerca del límite, con un 51,91 %, porque el encuadre ajustado deja mucho cuerpo en la imagen.
- **Rendijas**, como la prueba 2.5 de la vuelta 2: se cuentan los píxeles cuyo centro cae dentro del cuadrilátero `esquinas`, con la prueba del producto cruzado.

### 3.2 Rojo de las rendijas del teléfono: las esquinas del cuadrilátero están fuera del cuerpo

**Dónde están los 250 píxeles:** se agruparon por la esquina del cuadrilátero más cercana.

| Esquina | Píxeles | Caja (px del render) | Distancia máxima a la esquina | Alfa mínimo en la captura | Alfa máximo en el hueco |
|---|---|---|---|---|---|
| TL | 111 (70 con alfa 0) | 348…361 × 225…239 | 14,2 px | 0 | 249 |
| BL | 133 | 292…306 × 2034…2051 | 16,9 px | 14 | 242 |
| BR | 6 | 1157…1159 × 2116…2118 | 3,8 px | 26 | 248 |
| TR | 0 | — | — | — | — |

**Qué quiere decir:** no hay ni un píxel a lo largo de los lados ni dentro de la pantalla. Todos están en las puntas del cuadrilátero. En esos puntos, el propio `*_hueco.png` ya es transparente o semitransparente: es el borde del cuerpo o el fondo, no una rendija entre la captura y el bisel.

**Causa, con aritmética sobre las constantes del script:**
- Respecto a la esquina de la pantalla, el centro del arco del cuerpo del teléfono está a (2,2 − 9,5; 2,8 − 9,5) mm. Es decir, a **9,91 mm**.
- El radio del cuerpo es de **9,5 mm**, así que la esquina cuadrada de la pantalla cae **0,41 mm fuera del contorno del teléfono**.
- En la laptop, la misma cuenta da 2,83 mm frente a un radio de 10 mm: la esquina queda muy dentro, y por eso da 0.

**No es nuevo:** el borrador de la vuelta 3 (`capturas-dis/telefono_captura.png`, script v2.2) da **39** píxeles con la misma prueba. Se lo pasé ahora para comparar. En la vuelta 3 esta prueba no se corrió, y en la vuelta 2 daba 0 porque la captura todavía era rectangular y rellenaba esas puntas. Es justo lo que asomaba por fuera del cuerpo y lo que corrigieron las esquinas redondeadas.

**Consecuencia:** en el teléfono, la vara de rendijas por cuadrilátero y la vara de «nada asoma» no se pueden cumplir a la vez. Una vara de rendijas que sirva para las dos tendría que usar el rectángulo redondeado de la pantalla (`radio_pantalla_rel`) en vez del cuadrilátero. Queda para el rector; aquí no se cambió la vara.

**Recortes ampliados (×8) de las tres esquinas:** `rendija_tel_TL.png`, `rendija_tel_BL.png` y `rendija_tel_BR.png`, en el scratchpad de la sesión, fuera del repo. Se ven con el cuadrilátero en verde sobre magenta.

### 3.3 Rojo de las esquinas del WebP del teléfono: sombra por debajo del umbral, cortada por el margen

- **En el WebP:** la fila inferior de `telefono_web.webp` tiene alfa **1–5 en todo el ancho** (muestreada cada 33 px: 3 3 3 3 4 4 4 5 2 1). La fila superior tiene 0 en todo el ancho.
- **En la fuente:** en `telefono_captura.png`, la esquina inferior izquierda de `recorte_en_render` (99, 2263) tiene alfa **2**. Las otras tres esquinas tienen 0.

**Causa:** la sombra de contacto sigue más abajo con alfa de 1 a 5/255. `tinta_con_sombra` se mide con el alfa suavizado ≥ 10/255 (`UMBRAL_TINTA`), y el margen del 2 % no llega a cubrir esa cola. **Es la sombra real del render, no un artefacto de compresión del WebP.**

**Efecto visible:** sobre el verde de la Portada, un alfa de 3–5/255 cambia el color en torno a 1 nivel por canal. En los sellos no se aprecia. El corte es una línea recta en el borde inferior de la imagen, así que en teoría es visible sobre fondos muy claros; no es el caso de la Portada.

**Laptop:** 0 en las cuatro esquinas.

## 4. Lámina v1.2: Edge frente a WebKit (2.4)

**Condiciones:** `file://…/capturas-dis/lamina12/lamina.html` sin parámetros, con los valores por defecto (`?tel=30&lap=234`, guías activas y panel visible), a 1920×1080 @1. Se esperó a `window.__disListo === true` y a que las imágenes estuvieran completas, con `naturalWidth` > 0.

| Navegador | `error_px` laptop | `error_px` teléfono | `natural` | Errores de consola |
|---|---|---|---|---|
| Edge | **0,02** | **0,03** | 887×611 · 330×522 | **0** |
| WebKit | **0,02** | **0,03** | 887×611 · 330×522 | **0** |

**Vara `error_px` ≤ 1: verde** en los dos aparatos y en los dos navegadores. Los errores se contaron como `pageerror`, `console.error` y peticiones fallidas.

Cajas en px de página (izquierda · arriba · derecha · abajo), **idénticas en los dos navegadores**:

| Aparato | Esperado | Real |
|---|---|---|
| laptop | 452,27 · 529,45 · 820,27 · 782,94 | 452,27 · 529,44 · 820,27 · 782,92 |
| teléfono | 779,88 · 623,43 · 886,01 · 791,31 | 779,88 · 623,42 · 886,00 · 791,28 |

**Panel**, igual en los dos:
- laptop: silueta 331,8 × 234,0;
- teléfono: silueta 79,3 × 154,4;
- alto del teléfono / alto de la laptop: 66 %;
- aire con el lema: 107,7 px; aire con la frase: 14,0 px;
- ancho del conjunto: 393,7 px;
- sombra dentro de la pantalla: sí;
- imágenes: 46,7 / 27,1 KiB.

**Diferencia de píxeles** (Σ|Δ RGB| > 24, columna x 340…1012 e y 431…797):

| Píxeles de la columna | Distintos | % | Σ\|Δ\| máxima |
|---|---|---|---|
| 245 952 | 9 876 | **4,02 %** | 366 |

**Pasa del 3 %, así que se adjunta el mapa:** `capturas-dis/lamina12/_mapa_dif.png`, con lo distinto en rojo sobre la captura de Edge oscurecida.

**Cómo leerlo:** las diferencias están **solo en los bordes con contraste**:
- los contornos de los dos aparatos;
- las cartas, los números y los botones de las capturas;
- las teclas.

El fondo, las guías y los interiores lisos salen iguales. Es el patrón de dos filtros de reducción distintos: la laptop se dibuja a 368 px desde un WebP de 887. Tal como dice la ficha, es un dato y no una vara. A simple vista, los dos sellos son iguales y la captura cae dentro de la pantalla en los dos.

**Sellos:**
- `capturas-dis/lamina12/sello_edge.png`
- `capturas-dis/lamina12/sello_webkit.png`

## 5. Pesos y tamaños (2.5)

| Archivo | Bytes | Tamaño |
|---|---|---|
| `laptop_hueco.png` (16 bits) | 13 127 849 | 3200 × 2434 |
| `laptop_captura.png` (16 bits) | 19 185 620 | 3200 × 2434 |
| `telefono_hueco.png` (16 bits) | 4 269 081 | 1566 × 2400 |
| `telefono_captura.png` (16 bits) | 10 237 684 | 1566 × 2400 |
| **Maestras de 16 bits, total** | **46 820 234** (≈ 44,7 MiB) | |
| `laptop_web.webp` | 47 816 | 887 × 611 |
| `telefono_web.webp` | 27 784 | 330 × 522 |
| **Derivados web, total** | **75 600** | |
| Escena 5 hoy: `mesapc.webp` + `mesav.webp` | 31 050 + 35 280 = **66 330** | |

**La web crece 9 270 B (+14 %).** Para versionar en `maestras/dis1/`:
- solo los `*_hueco.png`: 17,4 MB. Con ellos basta para reencajar una maestra nueva sin repetir el render (§0);
- los cuatro PNG: 46,8 MB.

## 6. Rutas de los sellos

- `capturas-dis/lamina12/sello_edge.png`
- `capturas-dis/lamina12/sello_webkit.png`

## 7. Tiempo real de la tanda

**15:55 → 16:06**, unos **11 minutos**, de los que 5 min 10 s son el render.

**Sondas**, en el scratchpad de la sesión, fuera del repo:
- `f1b_render.mjs`: lanza y cronometra el render;
- `f1b_comprob.mjs`: §3;
- `f1b_rendijas_tel.mjs`: §3.2 y §3.3;
- `f1b_lamina.mjs`: §4.

STOP · Fase 1b completa · sin commits · a la espera de Victor
