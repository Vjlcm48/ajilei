# AJILEI · DIS-1 · Fase 1c · Reencaje, archivo de maestras y lámina móvil · Informe · v1.0

**Ficha:** `AJILEI_DIS-1_Fase1c_Movil_v1.0.md` · **Fecha:** 2026-09-30 · **Base:** `main` en `59fa46d`
**Ejecuta:** Claude Code

**Escrito:**

- `scripts/dis1/gen_dispositivos.py`: reemplazado por el adjunto (v3.1) sin editar. El diff con la v3 solo contiene los tres cambios de la ficha: `--reencajar`, `matriz_area` vectorizada y `BORDE_WEB_PX`.
- `capturas-dis/final/`, regenerado por `--reencajar`:
  - `*_captura.png`, `*_web.webp`, `*.json`, `datos.js` y `hoja.html`;
  - además, `_log_reencajar.txt` y `_comprob_1c.json` (medidas en bruto de §1 y §3).
  - El log del reencaje va aparte para **no pisar `_log.txt`**, que es el del render final y forma parte del archivo de maestras.
- `capturas-dis/lamina13/`:
  - `lamina.html` (el adjunto `lamina_dis1_v1.3.html`, sin editar);
  - `datos.js`, `laptop_web.webp` y `telefono_web.webp`;
  - `caso_*.png` (7), `indice_edge.png` e `indice_edge_pie.png`;
  - `_medidas_1c.json`.
- `C:\Users\victo\Downloads\AJILEI\DIS-1\render_final_2026-09-30\`: 9 copias (§2).
- Este informe.

Sin commits y sin `git add`. No se copió nada a `src/` ni se tocaron `maestras/`, `public/`, el arnés ni los protegidos. `git status` es el mismo que antes de la fase, más este informe.

**Navegadores:** Edge 154.0.4258.37 y WebKit 26.5 (playwright-core 1.62.1). **Blender:** 4.5.10.

> **Resumen:**
> - **El reencaje funciona:** código 0 en 89,6 s, **sin render de Cycles** (0 líneas `Sample` y 0 `Fra:`).
>   - Los `*_captura.png` reencajados son **idénticos al byte** a los del render de la 1b.
>   - El borde de los dos WebP tiene **alfa 0 exacto**, así que se cumple la vara.
> - **Pero el derivado web de la laptop sigue tardando 67,6 s,** no menos de 1 s. La vectorización de `matriz_area` no era el cuello de botella: el tiempo se va en el producto de matrices del numpy de Blender (§1.2). En el informe de la 1b atribuí esos 65 s a `matriz_area`; **estaba equivocado**.
> - **Archivo de maestras:** 9 de 9 copias con sha256 idéntico al original.
> - **Comprobaciones:**
>   - nada asoma: 0 y 0;
>   - rendija redefinida: 0 en la laptop, pero **39 en el teléfono (rojo)**;
>   - derivados: verdes.
>
>   Los 39 son el antialias del contorno exterior del teléfono, a 1 px del exterior y sin ningún aporte de la captura. La prueba redefinida sigue contándolos (§3.2).
> - **Lámina v1.3:** **14 de 14 en verde**, con cifras idénticas en Edge y WebKit. `error_px` ≤ 0,03, `ok` verdadero en todos y 0 errores. El aire más justo es 14 px (360×640 con el teléfono, y la frase en escritorio).

---

## 1. Reencaje sin Blender (2.1)

**Orden** (desde la raíz, cronometrada con `spawnSync` de Node):

```
"C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" -b --factory-startup --python scripts/dis1/gen_dispositivos.py -- --reencajar --salida capturas-dis/final --fondo "#1c4a2d"
```

**Salida literal** (`capturas-dis/final/_log_reencajar.txt`):

```
[DIS-1] laptop: reencajado · captura 4.5 s · web 887×611 47874 B en 67.57 s
[DIS-1] telefono: reencajado · captura 2.35 s · web 330×522 27752 B en 14.71 s
[DIS-1] listo (reencajado)
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)

Blender quit

--- código 0 · señal null · error - · 16:30:03 → 16:31:33 · 89.6 s ---
```

**Código 0.** En el log hay **0 líneas con `Sample` y 0 con `Fra:`**: no hubo render de Cycles.

| | `tiempos_s.captura` | `tiempos_s.web` | `web.bytes` (1b → 1c) | Alfa máximo del borde (fila y columna exteriores) |
|---|---|---|---|---|
| laptop | 4,5 | **67,57** | 47 816 → **47 874** | **0** (sup 0 · inf 0 · izq 0 · der 0) |
| teléfono | 2,35 | 14,71 | 27 784 → **27 752** | **0** (sup 0 · inf 0 · izq 0 · der 0) |

- **Tiempo total del proceso:** 89,6 s.
- **Vara del borde (0): verde en los dos.**
- **La rampa de 4 px, como dato:** alfa máximo por anillo, desde el borde hacia dentro:
  - laptop: 0 · 2 · 3 · 5 · 7 · 8;
  - teléfono: 0 · 2 · 4 · 7 · 9 · 9.

### 1.1 El reencaje reproduce la captura al byte

sha256 de `capturas-dis/final/` antes y después del reencaje:

| Archivo | Antes | Después |
|---|---|---|
| `laptop_captura.png` | `34f6fc7e…` | `34f6fc7e…` (**igual**) |
| `telefono_captura.png` | `37c9ceb5…` | `37c9ceb5…` (**igual**) |
| `*_hueco.png` | — | sin tocar (**igual**) |
| `*_web.webp` | `9f2ec6bb…` · `865999e4…` | `134f4e4a…` · `8d842b28…` (cambian por el borde desvanecido) |
| `*.json`, `datos.js` | — | cambian (`web`, `tiempos_s` y la marca `reencajado`) |

Con la misma maestra, `--reencajar` produce exactamente la captura del render. **El camino para actualizar la mesa queda probado.**

### 1.2 Por qué el derivado sigue tardando 65 s

Lo medí por partes con una sonda de Blender que importa las funciones del script, sin tocarlo y escribiendo solo en el scratchpad. Laptop, imagen de 2434 × 3200 × 4 en float32:

| Paso | Tiempo |
|---|---|
| `cargar_premult_lineal` | 1,11 s |
| `matriz_area` (las dos, vectorizada) | **0,02 s** |
| 1.ª `tensordot` (Ry 611×2434 · imagen) | **64,82 s** |
| 2.ª `tensordot` (· Rx) | 2,36 s |

Contraste del mismo producto (611×2434 · 2434×12800):

| Datos | Tiempo |
|---|---|
| la imagen real | 65,56 s |
| la imagen sin subnormales (tiene 0) | 65,26 s |
| **números aleatorios del mismo tamaño** | **65,35 s** |

**Conclusión:**
- No son los datos. El **`matmul` del numpy 1.26.4 que trae Blender** es así de lento en esta máquina: unos 19 GFLOP a unos 0,3 GFLOP/s.
- La `matriz_area` con bucles de la v3 ya era despreciable. Mi atribución del informe de la 1b era errónea, y la vectorización no cambia el tiempo aquí.
- **Inferencia, sin verificar:** los 0,6 s del rector salen probablemente de un numpy con una BLAS optimizada, o de una imagen de borrador.
- **No se probó ninguna alternativa,** porque la ficha no la pide. Para el rector: el primer producto es el caro porque multiplica por las 3 200 columnas × 4 canales. Reducir primero el eje ancho (`Rx`), o usar una reducción por bloques sin `matmul`, cambiaría el orden de magnitud.

## 2. Archivo de maestras (2.2)

`C:\Users\victo\Downloads\AJILEI` **existía**. Se creó `DIS-1\render_final_2026-09-30\` dentro, como permite la ficha.

**Copia** con `cp -p`, después del reencaje. Verificación con sha256 del original frente a la copia, por entrada estándar para que la ruta no altere la salida, y además `cmp` en el archivo mayor:

| Archivo | Bytes | sha256 | Copia |
|---|---|---|---|
| `laptop_hueco.png` | 13 127 849 | `91f34df77b0c4d2de41bdd72173f0b65c62ef2ab14bb7973ce64257fe948c441` | idéntica |
| `laptop_captura.png` | 19 185 620 | `34f6fc7efd351c89c11cd1c7f163c24d96d620cd122988cd8c4a0b6aff3be470` | idéntica |
| `telefono_hueco.png` | 4 269 081 | `a126ba6a9ff44820ae8d21f13d54ffaf49502e6c898a3d46b1e2dc22b27a76aa` | idéntica |
| `telefono_captura.png` | 10 237 684 | `37c9ceb5eff5e3a1c34a454cd2264cc56acb6a418f51549663987087aa2ce19c` | idéntica |
| `laptop.json` | 1 964 | `073fa98d450e6b10c7aa10a217d87e2ef9213f88353aa47d2192af254de256d8` | idéntica |
| `telefono.json` | 1 975 | `a05ca9e146f673df11be276133f9cc5ca576dc928de57e9ef45daaafaf42a433` | idéntica |
| `datos.js` | 3 862 | `7faa629bce116419ea31796c1136dad682ea038430e945647e891af98b1346d4` | idéntica |
| `hoja.html` | 2 593 | `29f41b08d0f345d2d841ae14854fda93d4b101be94ec33096e53ffc2f6775a1b` | idéntica |
| `_log.txt` | 44 518 | `cba4cd1b96b22184efa526e9555702cb759ceb278fbed087816b104aead75c08` | idéntica |

**9 de 9 idénticas.**

**Notas:**
- Los JSON, `datos.js` y `hoja.html` copiados son los **reencajados**: llevan la marca `reencajado` y el bloque `web` nuevo.
- `_log.txt` es el log del render final de la 1b. El del reencaje (`_log_reencajar.txt`) no está en la lista de la ficha y no se copió.
- Los WebP tampoco están en la lista, así que no se archivaron.

## 3. Comprobaciones con la prueba redefinida (2.3)

**Método:** Edge con canvas sobre el `final/` regenerado, igual que en la 1b.

| Prueba | laptop | teléfono |
|---|---|---|
| **1. Nada asoma** | **0** | **0** |
| exterior (validez > 50 %) | 57,95 %, válida | 51,91 %, válida |
| **2. Rendija redefinida** (dentro del cuadrilátero, fuera del exterior, alfa < 250) | **0** | **39** · **ROJO** (alfa mínimo 137) |
| rendija con la definición vieja (referencia) | 0 | 250 |
| píxeles dentro del cuadrilátero / de ellos en el exterior | 1 707 343 / 0 | 1 613 051 / 211 |
| **3. Derivado web:** tamaño leído = `web.tamano` | 887 × 611 ✓ | 330 × 522 ✓ |
| alfa de las 4 esquinas | 0 · 0 · 0 · 0 ✓ | 0 · 0 · 0 · 0 ✓ |
| alfa máximo de todo el borde | 0 ✓ | 0 ✓ |
| alfa del centro de `web.silueta_opaca` | 255 ✓ | 255 ✓ |

### 3.1 Qué cambió respecto a la 1b

- La redefinición quita **211 de los 250** píxeles del teléfono: los que caen en el exterior.
- Las esquinas del WebP del teléfono (1 y 3 en la 1b) quedan en 0 gracias al borde desvanecido.

### 3.2 Los 39 que quedan: el antialias del contorno del teléfono

| Esquina | Píxeles | Caja (px del render) | Distancia máxima a la esquina | Distancia máxima al exterior |
|---|---|---|---|---|
| TL | 18 | 348…361 × 225…239 | 14,2 px | **1 px** |
| BL | 18 | 293…306 × 2034…2051 | 16,9 px | **1 px** |
| BR | 3 | 1157…1159 × 2116…2117 | 3,8 px | **1 px** |

**Qué quiere decir:**
- En **ninguno de los 39 aporta nada la captura**: el alfa de `telefono_captura.png` es igual al de `telefono_hueco.png`.
- Ese alfa va de 137 a 249, y todos tocan el exterior.
- Son **la media corona de antialias del borde exterior del cuerpo** del teléfono, la misma que tiene todo su perfil (4 565 píxeles).
- Solo entran en la prueba porque las puntas del cuadrilátero sobresalen 0,41 mm del cuerpo (1b, §3.2).
- El exterior se define con alfa < 128, así que los píxeles del contorno con alfa de 128 a 249 no son exterior y cuentan.

**No es una rendija entre la captura y el bisel.** La vara de la ficha es 0, así que figura en **rojo** como está escrita. No se cambió la vara.

**Para el rector:** para que la vara no vea el contorno hace falta alguna de estas opciones:
- excluir los píxeles que tocan el exterior;
- contar solo donde el alfa de la captura sea menor que el del hueco más algo;
- medir dentro del rectángulo redondeado de la pantalla.

## 4. Lámina v1.3: 7 casos en Edge y WebKit (2.4)

**Condiciones:** `file://…/capturas-dis/lamina13/lamina.html`, cada caso a su viewport @1. Se esperó a `window.__disListo === true`, que la lámina solo activa con las imágenes completas y `naturalWidth` > 0. Los errores se contaron como `pageerror`, `console.error` y peticiones fallidas.

**Leyenda:**
- `error_px`: l = laptop, t = teléfono.
- `silueta_px`: ancho × alto de la silueta.

| # | Navegador | Caso | Viewport | `error_px` | `aire_lema` | `aire_frase` | `cabe` | `ok` | `silueta_px` | Errores |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Edge | `?vp=1920` | 1920×1080 | l 0,01 · t 0,02 | 107,94 | 14 | sí | **sí** | l 331,82 × 234 · t 79,31 × 154,39 | 0 |
| 2 | Edge | `?vp=s25&fase=tel` | 360×704 | t 0,02 | 22,1 | 28 | sí | **sí** | t 77,06 × 150 | 0 |
| 3 | Edge | `?vp=s25&fase=lap` | 360×704 | l 0,02 | 40,1 | 28 | sí | **sí** | l 187,18 × 132 | 0 |
| 4 | Edge | `?vp=390&fase=tel` | 390×844 | t 0,02 | 27,7 | 28 | sí | **sí** | t 78,08 × 152 | 0 |
| 5 | Edge | `?vp=390&fase=lap` | 390×844 | l 0,03 | 46 | 28 | sí | **sí** | l 189,59 × 133,7 | 0 |
| 6 | Edge | `?vp=640&fase=tel` | 360×640 | t 0,02 | **14** | 22 | sí | **sí** | t 67,81 × 132 | 0 |
| 7 | Edge | `?vp=640&fase=lap` | 360×640 | l 0,02 | 37,8 | 22 | sí | **sí** | l 153,43 × 108,2 | 0 |
| 1 | WebKit | `?vp=1920` | 1920×1080 | l 0,01 · t 0,02 | 107,94 | 14 | sí | **sí** | l 331,82 × 234 · t 79,31 × 154,39 | 0 |
| 2 | WebKit | `?vp=s25&fase=tel` | 360×704 | t 0,02 | 22,1 | 28 | sí | **sí** | t 77,06 × 150 | 0 |
| 3 | WebKit | `?vp=s25&fase=lap` | 360×704 | l 0,02 | 40,1 | 28 | sí | **sí** | l 187,18 × 132 | 0 |
| 4 | WebKit | `?vp=390&fase=tel` | 390×844 | t 0,02 | 27,7 | 28 | sí | **sí** | t 78,08 × 152 | 0 |
| 5 | WebKit | `?vp=390&fase=lap` | 390×844 | l 0,03 | 46 | 28 | sí | **sí** | l 189,59 × 133,7 | 0 |
| 6 | WebKit | `?vp=640&fase=tel` | 360×640 | t 0,02 | **14** | 22 | sí | **sí** | t 67,81 × 132 | 0 |
| 7 | WebKit | `?vp=640&fase=lap` | 360×640 | l 0,02 | 37,8 | 22 | sí | **sí** | l 153,43 × 108,2 | 0 |

**Vara:** `error_px` ≤ 1, `ok` verdadero y 0 errores. **14 de 14 en verde**, con cifras idénticas en los dos navegadores.

**Lo que confirma** las cifras del rector:
- **Aire más justo, 14 px:**
  - con el lema, en 360×640 con el teléfono;
  - con la frase, en el escritorio.
- **Laptop en móvil, más estrecha que hoy:**
  - S25: 187,2 px frente a 251,6 de la caja de hoy;
  - 390×844: 189,6 frente a 255,0;
  - 360×640: 153,4 frente a 202,6.

  En los tres casos la limita el alto: 132, 133,7 y 108,2 px, justo el de la caja. Lo juzga Victor con el control de aumento.

## 5. Capturas

**Los siete casos de Edge**, en `capturas-dis/lamina13/`:
- escritorio @1: `caso_1920_duo.png`. Es el caso sin `fase`, y la lámina lo llama `duo`;
- móviles @3:
  - `caso_s25_tel.png`, `caso_s25_lap.png`;
  - `caso_390_tel.png`, `caso_390_lap.png`;
  - `caso_640_tel.png`, `caso_640_lap.png`.

**Índice:**
- `capturas-dis/lamina13/indice_edge.png`: sin parámetros, a 1600×1400, página completa y tras 3 s.
  - **Aviso:** en esta captura, los dos marcos de 360×640 salen **negros**.
  - Quedan por debajo del pliegue de 1400 px, y Chromium no pinta los iframes de otro origen fuera de pantalla (con `file://`, cada marco es un origen distinto). La captura de página completa los recoge sin pintar, aunque antes se desplace la página para que carguen.
  - No es un fallo de la lámina: esos casos salen verdes a tamaño real (filas 6 y 7).
- `capturas-dis/lamina13/indice_edge_pie.png` (**complemento**): el mismo índice desplazado hasta el final, en captura de viewport. Muestra los seis marcos móviles cargados.

**Consola del índice:** 0 errores.

## 6. Tiempo real

**16:27 → 16:42**, unos **15 minutos**, de los que 1,5 min son el reencaje y unos 3 min la sonda de §1.2.

**Sondas**, en el scratchpad de la sesión, fuera del repo:
- `f1c_reencajar.mjs`: §1;
- `f1c_perfil.py` y `f1c_perfil2.py`: §1.2;
- `f1c_comprob.mjs`: §1 y §3;
- `f1c_rendija39.mjs`: §3.2;
- `f1c_lamina.mjs`, `f1c_indice.mjs` y `f1c_indice_pie.mjs`: §4 y §5.

STOP · Fase 1c completa · sin commits · a la espera de Victor
