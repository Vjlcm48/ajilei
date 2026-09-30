# AJILEI · DIS-1 · Fase 1a · Vuelta 4 · Técnica web en WebKit · Informe · v1.0

**Ficha:** `AJILEI_DIS-1_Fase1a_Vuelta4_WebKit_v1.0.md` · **Fecha:** 2026-09-29 · **Base:** `main` en `59fa46d`
**Ejecuta:** Claude Code

**Escrito:**
- `capturas-dis/lamina/lamina.html`, reemplazada por el adjunto `lamina_dis1_v1.1.html` sin editar;
- en `capturas-dis/lamina/`: `_mapa_edge_C1.png`, `_mapa_edge_C2.png`, `_mapa_webkit_C1.png` … `_mapa_webkit_C4.png` y `_v4_medidas.json` (medidas en bruto);
- este informe.

Sin commits y sin `git add`. No se tocó nada más: ni el script ni los protegidos. `git status` es el mismo que antes de la vuelta.

**Navegadores:** Edge 154.0.4258.37 y WebKit 26.5 (playwright-core 1.62.1).

> **Resumen:** **ninguna técnica pasa la vara en los dos navegadores.**
> - En **Edge** pasan `compuesta` y `premult`; `padre` falla por poco (12 y 18 px que asoman).
> - En **WebKit** fallan las cuatro configuraciones, **con cifras idénticas**. Así que la hipótesis de la ficha (el padre transformado) queda **descartada**.
>
> **Causa medida:** este WebKit **no aplica los términos de perspectiva** de la `matrix3d` (`m14` y `m24`). Dibuja solo la parte afín. La caja real de la captura coincide al 0,01 px con la de la matriz sin perspectiva, en los dos aparatos y en las cuatro configuraciones (§3).
>
> No hay técnica ganadora, así que no se hicieron las capturas `sello_*.png`. STOP.

---

## 1. Matriz de pruebas

**Condiciones:** `?tel=30&lap=234&guias=0&panel=0`, 1920×1080 @2.

**Método:** el de la ficha, §2:
- Espera a `__disListo` y a las imágenes completas, y guarda `__disDiag()`.
- Captura **B** con `body{background:#ff00ff}` y los textos de referencia ocultos, y captura **A** además con `.cap{visibility:hidden}`.
- **Exterior:** magenta exacto de A (R ≥ 250, G ≤ 5, B ≥ 250) conectado con el borde, por inundación desde los cuatro bordes.
- **Asoma:** píxeles del exterior con Σ|Δ RGB| entre A y B > 30.
- **Sin cubrir:** píxeles con el centro dentro del cuadrilátero `pantalla` (×2), fuera del exterior y que en B siguen magenta (Σ|Δ| con `#ff00ff` < 30).

**Validez:** el exterior cubre el **96,62 %** de la imagen en las 8 combinaciones: 8 013 865 px en Edge y 8 014 152 en WebKit, de 8 294 400. **Las 8 pruebas son válidas.**

| Navegador | Config | `error_px` laptop | `error_px` teléfono | Asoma | Sin cubrir (lap + tel) | Errores | Veredicto |
|---|---|---|---|---|---|---|---|
| Edge | C1 `padre` | 0,02 | 0,01 | **12** | 0 + 0 | 0 | **ROJO** |
| Edge | C2 `padre&radio=0` | 0,02 | 0,01 | **18** | 0 + 0 | 0 | **ROJO** |
| Edge | C3 `compuesta` | 0,01 | 0,01 | 0 | 0 + 0 | 0 | verde |
| Edge | C4 `premult` | 0,02 | 0,01 | 0 | 0 + 0 | 0 | verde |
| WebKit | C1 `padre` | **18,79** | **1,72** | **5 940** | **1 010 + 224** | 0 | **ROJO** |
| WebKit | C2 `padre&radio=0` | **18,79** | **1,72** | **6 005** | **915 + 181** | 0 | **ROJO** |
| WebKit | C3 `compuesta` | **18,79** | **1,72** | **5 940** | **1 010 + 224** | 0 | **ROJO** |
| WebKit | C4 `premult` | **18,79** | **1,72** | **5 940** | **1 010 + 224** | 0 | **ROJO** |

**Vara:** `error_px` ≤ 1 en los dos aparatos, asoma ≤ 2, sin cubrir ≤ 2 y 0 errores. **Consola:** 0 errores de página y de consola en las 8.

**Cómo leerlo:**
- **C3 y C4 dan en WebKit exactamente lo mismo que C1**, píxel a píxel en asoma y sin cubrir. Da igual que la escala esté en el padre, compuesta o premultiplicada.
- **El radio (C2)** solo mueve unos pocos píxeles de las esquinas redondeadas. No influye en el defecto.
- **En Edge**, los 12 y 18 px de `padre` están en el borde superior de la pantalla del teléfono, @2 x 1594…1673 e y 1255…1271 (unos 40 × 8 px CSS). Es el mismo resto de antialias que vio la vuelta 3, ya reducido por el sangrado nuevo. Con `compuesta` y `premult` desaparece. La prueba del rector en Chromium daba 1 con `padre`; aquí salen 12 y 18.

## 2. Combinaciones rojas: `esperado` frente a `real`

Cajas de `.cap` en px de página, en el orden izquierda · arriba · derecha · abajo.

### Edge C1 y C2

| Aparato | Esperado | Real | `error_px` |
|---|---|---|---|
| laptop | 489,22 · 546,98 · 725,58 · 690,85 | 489,22 · 546,97 · 725,58 · 690,83 | 0,02 |
| teléfono | 794,57 · 630,02 · 869,23 · 780,22 | 794,56 · 630,01 · 869,22 · 780,22 | 0,01 |

La caja es correcta. Lo que falla es el pintado del borde superior del teléfono (§1). Mapas: `_mapa_edge_C1.png` y `_mapa_edge_C2.png`.

### WebKit C1, C2, C3 y C4 (iguales en las cuatro)

| Aparato | Esperado | Real | `error_px` |
|---|---|---|---|
| laptop | 489,22 · 546,98 · 725,58 · 690,85 | 489,22 · **550,66** · **744,37** · **688,34** | **18,79** (borde derecho) |
| teléfono | 794,57 · 630,02 · 869,23 · 780,22 | **794,83** · 630,01 · **867,51** · **779,28** | **1,72** (borde derecho) |

Mapas: `_mapa_webkit_C1.png` … `_mapa_webkit_C4.png`.

**Cómo leer los mapas:** son un recorte de B (@2, x 760…2000 e y 880…1680), con lo que asoma en **verde** y lo sin cubrir en **amarillo**.

**Qué muestran:** en la laptop, una franja verde por fuera del bisel derecho, @2 x 1442…1487 e y 1101…1356. Sin cubrir, en la laptop @2 x 1003…1423 e y 1096…1378, y en el teléfono @2 x 1599…1736 e y 1261…1477.

## 3. Causa: WebKit descarta la perspectiva de la `matrix3d`

La ficha pide no probar variantes propias en la lámina, y no se probó ninguna. Lo que sigue es **aritmética sobre lo ya medido**.

**Método:** se aplicó cada interpretación de la matriz a las cuatro esquinas de la captura y se comparó su caja con la `real` de WebKit (C1). Se usaron la matriz de Edge, el `scale` computado del `.dis` y el origen deducido de `esperado`.

| Interpretación | Laptop: caja resultante | Máx \|Δ\| con WebKit | Teléfono: máx \|Δ\| |
|---|---|---|---|
| exacta (la de Edge) | 489,22 · 546,98 · 725,58 · 690,84 | 18,79 | 1,72 |
| términos redondeados a 6 decimales (así serializa WebKit) | 489,22 · 546,97 · 725,48 · 690,82 | 18,89 | 1,73 |
| `m14` y `m24` intercambiados | 489,22 · 551,89 · 741,12 · 680,45 | 7,89 | 5,14 |
| perspectiva con signo cambiado | 489,22 · 554,98 · 765,74 · 696,45 | 21,37 | 1,64 |
| parte afín traspuesta | 487,30 · 555,29 · 713,42 · 694,19 | 30,95 | 5,73 |
| **sin perspectiva** (`m14 = m24 = 0`) | **489,22 · 550,67 · 744,37 · 688,35** | **0,01** | **0,01** |

**Resultado:** WebKit dibuja la captura como si la matriz fuera **afín**. La laptop tiene más perspectiva (`m14` ≈ 9,5·10⁻⁵ y `m24` ≈ −2,8·10⁻⁵) y se desvía 18,8 px; el teléfono tiene menos y se desvía 1,7 px. Esto explica por qué la vuelta 3 vio el defecto sobre todo en la laptop.

**Qué se ve al consultar el navegador** (una página vacía, fuera de la lámina):

| | `matchMedia('(-webkit-transform-3d)')` | `perspective(100px) rotateY(30deg)` en una caja de 100 px |
|---|---|---|
| Edge | `true` | 92,38 px de ancho |
| WebKit | **`false`** | 111,60 px |

Este WebKit **declara no tener transformaciones 3D**. Es la compilación de Playwright para Windows, aunque su `userAgent` dice «Macintosh … Version/26.5 Safari».

**Consecuencia para el rector (inferencia, sin verificar):** es probable que el defecto sea de este banco de pruebas y no de Safari real en macOS o iOS, que sí tiene 3D. Aquí no se puede comprobar, porque no hay Safari de Apple en esta máquina.

Mientras tanto, cualquier encaje con `matrix3d` proyectiva dará rojo en el WebKit de esta máquina, sea cual sea la técnica. Para seguir hay dos caminos:
- una **vara de WebKit que sepa de esta limitación**, por ejemplo comprobando `-webkit-transform-3d` y cambiando de criterio;
- una **técnica que no dependa de la perspectiva CSS**, como un derivado de la captura ya deformado en raster: el mismo `*_captura.png` de Blender, u otro.

La decisión es del rector y de Victor.

## 4. Técnica ganadora

**Ninguna.** En el orden de la ficha:
- `compuesta`: verde en Edge y rojo en WebKit;
- `premult`: verde en Edge y rojo en WebKit;
- `padre`: rojo en los dos.

Como no hay ganadora, **no se generaron** `sello_edge.png` ni `sello_webkit.png`, y no se probaron variantes propias.

## 5. Tiempo real

**16:12 → 16:16**, unos **4 minutos**.

**Sondas**, en el scratchpad de la sesión, fuera del repo:
- `v4.mjs`: las 8 combinaciones y los mapas;
- `v4_3d.mjs`: la consulta de 3D.

STOP · Vuelta 4 completa · sin commits · a la espera de Victor
