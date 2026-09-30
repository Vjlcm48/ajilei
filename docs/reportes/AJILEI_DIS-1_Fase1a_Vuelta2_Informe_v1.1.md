# AJILEI · DIS-1 · Fase 1a · Vuelta 2 · Informe · v1.1

**Ficha:** `AJILEI_DIS-1_Fase1a_Vuelta2_v1.1.md` · **Fecha:** 2026-09-29 · **Base:** `main` en `59fa46d`
**Ejecuta:** Claude Code

**Escrito:**
- `scripts/dis1/gen_dispositivos.py`, que ya es el adjunto de la v1.1;
- `capturas-dis/`, sobrescrita;
- este informe. El informe v1.0 se conserva tal cual.

Sin commits y sin `git add`. No se tocaron `src/`, `maestras/`, `public/`, el arnés ni los protegidos.

**Cómo se hizo el reemplazo:** el adjunto de la v1.1 solo difiere del script de la v1.0 en `suavizar()`: el docstring y `np.pad(a, r, mode="constant")`. Se sustituyó ese bloque y el archivo quedó igual al adjunto. No hay ningún otro cambio.

---

## 1. Salida y tiempos

```
"C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" -b --factory-startup --python scripts/dis1/gen_dispositivos.py -- --calidad borrador --salida capturas-dis --fondo "#1c4a2d"
```

```
[DIS-1] laptop: 1200×913 · hueco 8.54 s · captura 1.36 s · comprobaciones OK
[DIS-1] telefono: 587×900 · hueco 3.65 s · captura 0.71 s · comprobaciones OK
[DIS-1] listo
```

**Código de salida: 0.** Proceso completo: 19,14 s de reloj (`spawnSync` de Node). Log en `capturas-dis/_log.txt` (198 líneas).

| Aparato | `tiempos_s.hueco` | `tiempos_s.captura` |
|---|---|---|
| laptop | 8,54 | 1,36 |
| teléfono | 3,65 | 0,71 |

## 2. Por aparato

| | Laptop | Teléfono |
|---|---|---|
| Resolución | 1200 × 913 | 587 × 900 |
| `centro_hueco_transparente` | true | true |
| `centro_captura_opaco` | true | true |
| `bisel_opaco` | true | true |
| `esquinas_dentro_de_imagen` | true | true |
| `silueta_no_toca_borde` | **true** | true |
| `silueta_opaca` | [128, 113, 955, 674] | [102, 71, 377, 734] |
| `tinta_con_sombra` | **[72, 107, 1017, 689]** | [54, 66, 472, 768] |
| `esquinas` TL · TR · BR · BL | (158,73 · 162,581) · (797,717 · 138,801) · (835,158 · 496,571) · (190,696 · 548,970) | (130,62 · 84,441) · (460,415 · 98,001) · (434,953 · 794,369) · (109,543 · 768,944) |

**Blender:** 4.5.10 LTS.

**Sobre la tinta de la laptop:** coincide al píxel con la réplica del informe v1.0 (§5, «con solo (1199, 0) a cero»). La ficha cita `[66, 101, 1029, 701]` de la prueba del rector. La diferencia de 6 px por lado es de la máquina del rector frente a esta; no es un error, pero conviene saberlo si se sellan cifras.

## 3. Esquinas (2.4)

**Método:** Edge 154 con canvas; alfa de `*_hueco.png` a 3 px del punto medio de cada lado. **Vara:** dentro ≤ 5 y fuera ≥ 230.

| Aparato | Lado | Punto medio | Alfa dentro | Alfa fuera | |
|---|---|---|---|---|---|
| laptop | arriba | 478,22 · 150,69 | 0 | 255 | ✔ |
| laptop | derecha | 816,44 · 317,69 | 0 | 255 | ✔ |
| laptop | abajo | 512,93 · 522,77 | 0 | 255 | ✔ |
| laptop | izquierda | 174,71 · 355,78 | 0 | 255 | ✔ |
| teléfono | arriba | 295,52 · 91,22 | 0 | 255 | ✔ |
| teléfono | derecha | 447,68 · 446,19 | 0 | 255 | ✔ |
| teléfono | abajo | 272,25 · 781,66 | 0 | 255 | ✔ |
| teléfono | izquierda | 120,08 · 426,69 | 0 | 255 | ✔ |

**8 de 8 en verde.**

## 4. Sin rendijas (2.5)

**Método:** Edge con canvas sobre `*_captura.png`. Se cuentan los píxeles cuyo centro (x + 0,5 · y + 0,5) cae dentro del cuadrilátero de `esquinas`, con la prueba del producto cruzado sobre los 4 lados.

| Aparato | Píxeles dentro | Con alfa < 250 | Alfa mínimo |
|---|---|---|---|
| laptop | 240 096 | **0** | 255 |
| teléfono | 226 636 | **0** | 255 |

**0 en los dos.**

## 5. Avisos del log

**Ninguno:** 0 coincidencias de `aviso`, `Warning`, `Error` o `Traceback`.

## 6. Capturas de la hoja (2.3)

Regeneradas, ahora sí del render nuevo:

| Archivo | Tamaño |
|---|---|
| `capturas-dis/hoja_1920.png` | 1920 × 3360 |
| `capturas-dis/hoja_390.png` | 390 × 2193 |

## 7. Tiempo real

**15:25 → 15:28**, unos **3 minutos**.

STOP · Vuelta 2 completa · sin commits · a la espera de Victor
