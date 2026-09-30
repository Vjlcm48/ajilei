# AJILEI · DIS-1 · Fase 1a · Vuelta 2 · Informe · v1.0

**Ficha:** `AJILEI_DIS-1_Fase1a_Vuelta2_v1.0.md` · **Fecha:** 2026-09-29 · **Base:** `main` en `59fa46d`
**Ejecuta:** Claude Code

**Escrito:**
- `scripts/dis1/gen_dispositivos.py`, reemplazado entero por el adjunto y sin editar;
- `capturas-dis/`, sobrescrita por el script;
- este informe.

Sin commits y sin `git add`. No se tocaron `src/`, `maestras/`, `public/`, el arnés ni los protegidos.

> **El script terminó con código 1.** La ficha (§1) dice: «Si el script falla, se reporta la salida literal y STOP». Por eso **no se ejecutaron** los pasos 2.3 (capturas de la hoja), 2.4 (esquinas) y 2.5 (rendijas). Solo se leyó lo que el script ya había escrito, para dejar el diagnóstico (§5).

---

## 1. Salida y tiempos

**Comando**, lanzado desde la raíz con `spawnSync` de Node y la ruta del ejecutable con barras normales:

```
"C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" -b --factory-startup --python scripts/dis1/gen_dispositivos.py -- --calidad borrador --salida capturas-dis --fondo "#1c4a2d"
```

**Salida literal** (líneas `[DIS-1]` de `capturas-dis/_log.txt`, 194 líneas):

```
[DIS-1] laptop: 1200×913 · hueco 8.35 s · captura 1.34 s · comprobaciones FALLO
[DIS-1] telefono: 587×900 · hueco 3.52 s · captura 0.71 s · comprobaciones OK
[DIS-1] FALLOS: laptop: silueta_no_toca_borde
```

**Código de salida: 1.** Proceso completo: 18,70 s de reloj.

| Aparato | `tiempos_s.hueco` | `tiempos_s.captura` |
|---|---|---|
| laptop | 8,35 | 1,34 (encaje por homografía, sin render) |
| teléfono | 3,52 | 0,71 |

## 2. Por aparato

| | Laptop | Teléfono |
|---|---|---|
| Resolución | **1200 × 913** (en la vuelta 1, 1200 × 927) | 587 × 900 |
| `centro_hueco_transparente` | true | true |
| `centro_captura_opaco` | true | true |
| `bisel_opaco` | true | true |
| `esquinas_dentro_de_imagen` | true | true |
| `silueta_no_toca_borde` | **false** | true |
| `silueta_opaca` | [128, 113, 955, 674] | [102, 71, 377, 734] |
| `tinta_con_sombra` | **[72, 0, 1128, 796]**: toca arriba (y = 0) y la derecha (72 + 1128 = 1200) | [54, 66, 472, 768] |
| `esquinas` | TL (158,73 · 162,581) · TR (797,717 · 138,801) · BR (835,158 · 496,571) · BL (190,696 · 548,970) | TL (130,62 · 84,441) · TR (460,415 · 98,001) · BR (434,953 · 794,369) · BL (109,543 · 768,944) |

El teléfono no cambió respecto a la vuelta 1: mismas esquinas, silueta y tinta.

## 3. Esquinas (2.4)

**No ejecutado**, por el STOP de §1 de la ficha.

## 4. Rendijas (2.5)

**No ejecutado**, por el mismo motivo.

## 5. Avisos del log y diagnóstico del fallo

**Avisos:** ninguno. No aparece `aviso`, `Warning`, `Error` ni `Traceback`. Tampoco «la sombra toca el borde de la toma amplia»: la toma de medida (A) no tocó los bordes.

**Diagnóstico** (solo lectura de `laptop_hueco.png` con Edge y canvas; no se relanzó nada):

1. **Qué hay en los bordes.** En `laptop_hueco.png`, el único píxel de borde con alfa ≥ 10 es **(1199, 0)**, la esquina superior derecha, con **alfa 48**. Es una mota aislada: el resto de la fila 0 tiene alfa ≤ 8 y la columna derecha también.
   - Columna 0: alfa máximo 5, un velo de sombra.
   - Fila inferior: alfa máximo 8.
2. **Por qué eso basta para fallar.** `suavizar()` usa `np.pad(mode="edge")` con r = 7 (ventana de 15×15). En la esquina, el relleno replica ese píxel **8×8 = 64 veces** dentro de la ventana: la media queda en 64·48/225 ≈ **13,7/255**, por encima de `UMBRAL_TINTA` (10/255). La caja de tinta se estira hasta y = 0 y x = 1199.
3. **Comprobación.** Una réplica de `suavizar` más `caja_alfa` con el mismo relleno y el mismo umbral reproduce la cifra del script **exacta**:

   | Caso | Tinta | ¿Toca el borde? |
   |---|---|---|
   | tal cual | [72, 0, 1128, 796] | sí |
   | con solo (1199, 0) a cero | **[72, 107, 1017, 689]** | no; márgenes izq 72 · arr 107 · der 111 · aba 117 |
   | teléfono, tal cual | [54, 66, 472, 768] | no (no tiene mota) |

**Lectura:** la sombra y el aparato caben con holgura. El rojo lo produce una mota de ruido de Cycles en la esquina, amplificada por el relleno por borde de la medida. Cómo tratarla, en el render o en la medida, lo decide el rector. No se edita el script.

## 6. Estado de `capturas-dis/`

- **De esta vuelta (15:10):** `_log.txt`, `hoja.html`, `laptop.json`, `laptop_hueco.png`, `laptop_captura.png`, `telefono.json`, `telefono_hueco.png` y `telefono_captura.png`. El script escribe todo aunque falle.
- **`hoja_1920.png` y `hoja_390.png` son de la vuelta 1 (14:34)**, porque el paso 2.3 no se ejecutó. **No reflejan el render nuevo.**

**Sondas usadas**, en el scratchpad de la sesión, fuera del repo: `lanzar_1a.cjs`, `borde_v2.mjs` y `tinta_v2.mjs`.

## 7. Tiempo real

**15:07 → 15:14**, unos **7 minutos**.

STOP · Vuelta 2 completa · sin commits · a la espera de Victor
