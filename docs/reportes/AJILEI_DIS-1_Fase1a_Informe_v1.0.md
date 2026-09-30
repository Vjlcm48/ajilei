# AJILEI · DIS-1 · Fase 1a · Informe · v1.0

**Ficha:** `AJILEI_DIS-1_Fase1a_Borrador_v1.0.md` · **Fecha:** 2026-09-29 · **Base:** `main` en `59fa46d`
**Ejecuta:** Claude Code

**Escrito:**
- `scripts/dis1/gen_dispositivos.py`, copia del adjunto sin editar;
- una línea en `.gitignore` (`capturas-dis/`, detrás de `capturas-cap/`);
- `capturas-dis/`;
- este informe.

Sin commits y sin `git add`. No se tocaron `src/`, `maestras/`, `public/`, el arnés ni los protegidos.

**Fuera del repositorio:**
- el script escribió sus dos tomas de medida en `%TEMP%\dis1_medida_laptop.png` y `%TEMP%\dis1_medida_telefono.png`, donde manda `tempfile.gettempdir()`;
- las sondas de 2.2, 2.3 y 2.5 viven en el scratchpad de la sesión: `fondo.mjs`, `lanzar_1a.cjs` y `verif_1a.mjs`.

---

## 1. Fondo usado (2.2)

**`#1c4a2d`**

**De dónde sale:** `src/styles/portada.css:66-69`, el `background` de `.pue-lienzo`:

```
var(--filigrana),
radial-gradient(ellipse at 42% 38%, var(--green-bright) 0%, var(--green-deep) 50%, var(--green-abyss) 100%)
```

Los tokens están en `src/styles/theme.css`:

| Token | Valor | Línea |
|---|---|---|
| `--green-bright` | `#235c38` | 51 |
| `--green-deep` | `#153922` | 49 |
| `--green-abyss` | `#09170e` | 42 |

Las redefiniciones de `tapetes.css` son de la mesa, no de la Portada.

Al ser un degradado con filigrana, el color se **midió en píxeles**:
- método: `vite preview` en 4173 y Edge 154, con `.pue-escenario` oculto, y la media de la caja de `.pue-duo`, que es la zona de los aparatos;
- 1920×1080: **media `#1c4a2d`** (centro `#1c4b2d`; mínimo `#163b23`, máximo `#325c35` por las líneas de la filigrana);
- mismas medidas en otros viewports: 1366×768 `#1b462a`, S25 360×704 `#1a4529`, 390×844 `#1b4529`.

Se usó el valor de 1920, que es donde la hoja compone los dos juntos. Solo afecta a la hoja.

## 2. Comando y tiempos (2.3)

```
"C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" -b --factory-startup --python scripts/dis1/gen_dispositivos.py -- --calidad borrador --salida capturas-dis --fondo "#1c4a2d"
```

Se lanzó desde la raíz con `spawnSync` de Node, y la salida completa está en `capturas-dis/_log.txt` (297 líneas). La ruta del ejecutable va con barras normales: con barras invertidas, el `spawnSync` de los dos primeros intentos no encontró el ejecutable (ENOENT; Blender no llegó a arrancar).

**Resultado:** código **0**, `[DIS-1] listo`.

| Render | `tiempos_s` |
|---|---|
| laptop · hueco | 8,29 s |
| laptop · captura | 8,99 s |
| teléfono · hueco | 3,56 s |
| teléfono · captura | 3,74 s |
| **Suma de renders** | **24,58 s** |
| **Proceso completo** (con las tomas de medida y el arranque) | **29,90 s** de reloj |

## 3. Por aparato

| | Laptop | Teléfono |
|---|---|---|
| Resolución | **1200 × 927** | **587 × 900** |
| Muestras | 64 | 64 |
| `centro_hueco_transparente` | true | true |
| `centro_captura_opaco` | true | true |
| `bisel_opaco` | true | true |
| `esquinas_dentro_de_imagen` | true | true |
| `silueta_no_toca_borde` | true | true |
| `silueta_opaca` [x, y, ancho, alto] | [128, 122, 955, 684] | [102, 71, 377, 734] |
| `tinta_con_sombra` | [72, 116, 1018, 700] | [54, 66, 472, 768] |
| `px_por_metro` | 2338,42 | 5012,79 |
| `esquinas` TL | (158,264 · 171,428) | (130,62 · 84,441) |
| `esquinas` TR | (797,952 · 147,971) | (460,415 · 98,001) |
| `esquinas` BR | (835,435 · 506,074) | (434,953 · 794,369) |
| `esquinas` BL | (190,264 · 558,183) | (109,543 · 768,944) |
| `centro_pantalla` | (507,52 · 344,024) | (282,377 · 438,449) |

**Archivos:**

| Archivo | Bytes |
|---|---|
| `laptop_hueco.png` | 638 496 |
| `laptop_captura.png` | 876 889 |
| `telefono_hueco.png` | 269 370 |
| `telefono_captura.png` | 525 901 |
| `hoja.html` | — |
| `hoja_1920.png` (1920 × 3384) | 1 759 285 |
| `hoja_390.png` (390 × 2203) | 289 235 |

## 4. Verificación independiente de las esquinas (2.5)

**Método:**
- Edge 154 con canvas, que es la receta de `gen-portada-assets.mjs`;
- se lee `*_hueco.png` con `getImageData` en el píxel que contiene el punto;
- el punto está a 3 px del punto medio de cada lado del cuadrilátero de `esquinas`, sobre la normal: hacia el centroide para «dentro» y en sentido contrario para «fuera».

**Vara:** dentro ≤ 5 y fuera ≥ 230.

| Aparato | Lado | Punto medio | Alfa dentro (3 px) | Alfa fuera (3 px) | Veredicto |
|---|---|---|---|---|---|
| laptop | arriba (TL–TR) | 478,11 · 159,70 | 0 | 255 | ✔ |
| laptop | derecha (TR–BR) | 816,69 · 327,02 | 0 | 255 | ✔ |
| laptop | abajo (BR–BL) | 512,85 · 532,13 | 0 | 255 | ✔ |
| laptop | izquierda (BL–TL) | 174,26 · 364,81 | 0 | 255 | ✔ |
| teléfono | arriba (TL–TR) | 295,52 · 91,22 | 0 | 255 | ✔ |
| teléfono | derecha (TR–BR) | 447,68 · 446,19 | 0 | 255 | ✔ |
| teléfono | abajo (BR–BL) | 272,25 · 781,66 | 0 | 255 | ✔ |
| teléfono | izquierda (BL–TL) | 120,08 · 426,69 | 0 | 255 | ✔ |

**8 de 8 en verde.** Las esquinas del JSON caen sobre el borde real del hueco transparente.

## 5. Versión de Blender

`"blender": "4.5.10 LTS"`, según los dos JSON. El log dice «Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)».

## 6. Avisos del log

Ninguno. No hay `aviso`, `Warning`, `Error` ni `Traceback` en `_log.txt`. En concreto, **no** aparece «la sombra toca el borde de la toma amplia».

**Observación visual, sin juicio de diseño** (es de Victor), en `hoja_1920.png`:
- con esta luz, el cuerpo de la laptop se lee como **gris metálico medio-claro** más que como grafito oscuro;
- persiste el **brillo blanco del panel táctil** que la ficha ya anotaba;
- los bordes del teléfono también sacan reflejos grises claros.

## 7. Tiempo real

**14:30 → 14:36**, unos **6 minutos**. De ellos, 30 s de Blender, el build y `vite preview` para medir el fondo, y las capturas y la verificación con Edge.

STOP · Fase 1a completa · sin commits · a la espera de Victor
