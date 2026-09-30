# AJILEI · DIS-1 · Fase 1a · Vuelta 3 + Lámina · Informe · v1.0

**Ficha:** `AJILEI_DIS-1_Fase1a_Vuelta3_Lamina_v1.0.md` · **Fecha:** 2026-09-29 · **Base:** `main` en `59fa46d`
**Ejecuta:** Claude Code

**Escrito:**
- `scripts/dis1/gen_dispositivos.py` (v2.2);
- `capturas-dis/`, con `capturas-dis/lamina/`;
- este informe.

Sin commits y sin `git add`. No se tocaron `src/`, `maestras/`, `public/`, el arnés ni los protegidos. Los WebP se **copiaron**: `git status` de `src/` está limpio.

**Cómo se hizo:**
- **Script:** el v2.2 difiere del v1.1 en cinco bloques: la línea de `datos.js` en el docstring, `radio_pantalla_rel()`, el recorte redondeado de `encajar_captura`, el campo `radio_pantalla_rel` del JSON y la escritura de `datos.js`. Se sustituyeron esos cinco y el archivo quedó igual al adjunto.
- **Lámina:** copiada sin editar como `capturas-dis/lamina/lamina.html`.

**Navegadores:** Edge 154.0.4258.37 y WebKit 26.5 (playwright-core 1.62.1).

> **Resumen:** Blender, «nada asoma» (2.2), la consola y las cajas de Edge frente a WebKit salen verdes. **La prueba de la técnica web (2.5) sale roja:**
> - **en WebKit**, en los tres tamaños: la `matrix3d` proyectiva de la captura de la laptop no se pinta como en Edge;
> - **en Edge**, levemente, en +30 y +50.
>
> Las cajas de `img.ren` que pide la vara de 2.6 son iguales, pero no ven el defecto.

---

## 1. Render

```
[DIS-1] laptop: 1200×913 · hueco 8.29 s · captura 1.32 s · comprobaciones OK
[DIS-1] telefono: 587×900 · hueco 3.55 s · captura 0.7 s · comprobaciones OK
[DIS-1] listo
```

**Código 0.** Proceso: 16,68 s de reloj. `capturas-dis/datos.js`: 2 801 B. Log sin avisos.

| | Laptop | Teléfono |
|---|---|---|
| `tiempos_s` | hueco 8,29 · captura 1,32 | hueco 3,55 · captura 0,70 |
| `centro_hueco_transparente` | true | true |
| `centro_captura_opaco` | true | true |
| `bisel_opaco` | true | true |
| `esquinas_dentro_de_imagen` | true | true |
| `silueta_no_toca_borde` | true | true |

## 2. `radio_pantalla_rel`

| Aparato | Valor | Origen |
|---|---|---|
| laptop | **0,008741** | 2,5 mm / 286 mm |
| teléfono | **0,107353** | 7,3 mm / 68 mm |

En la lámina, el `border-radius` de la captura de la laptop computa **7,17 px**, que es 0,008741 × 820.

## 3. Nada asoma fuera del cuerpo (2.2)

**Método:** Edge con canvas. Exterior = alfa < 128 en `*_hueco.png` conectado con el borde (inundación desde los cuatro bordes). Se cuentan los píxeles del exterior con alfa de `_captura` > alfa de `_hueco` + 10.

| Aparato | Exterior (px) | Asoman |
|---|---|---|
| laptop | 634 887 | **0** |
| teléfono | 274 304 | **0** |

## 4. La técnica web también cumple (2.5): ROJO

**Método:** @2, `?guias=0&panel=0`, `body{background:#ff00ff}` y `.ref-lema` y `.ref-frase` ocultos.
- **B:** captura con `.cap` visible.
- **A:** captura con `.cap{visibility:hidden}`.
- **Exterior:** magenta exacto de A (R ≥ 250, G ≤ 5, B ≥ 250) conectado con el borde.
- Se cuentan los píxeles del exterior con Σ|Δ RGB| > 30 entre A y B.

| | +30 | +50 | +70 |
|---|---|---|---|
| **Edge** | **11** | **42** | 0 |
| **WebKit** | **6 112** | **6 112** | **6 112** |

**Dato complementario, fuera de la vara:** píxeles de pantalla **sin cubrir**, es decir, magenta de A dentro del hueco que sigue magenta en B.

| | +30 | +50 | +70 |
|---|---|---|---|
| Edge | 1 | 1 | 2 |
| WebKit | **1 352** | **1 463** | **1 568** |

**Diagnóstico** (mapas `capturas-dis/lamina/_mapa_webkit_50.png` y `_mapa_edge_50.png`, recorte de la laptop con las diferencias exteriores en verde):

- **WebKit.** La captura de la laptop sale **deformada**: la `matrix3d` computada es la misma en los dos navegadores, pero su gBCR mide **256,6 × 137,9 en WebKit frente a 237,6 × 144,1 en Edge** (+30 %, +50 %). La imagen no sigue el trapecio del hueco:
  - asoma una franja por fuera del bisel derecho: 47 × 256 px @2, unos 23 × 128 CSS;
  - deja sin cubrir unos 1 400 px del hueco.

  La fuga se desplaza con la laptop entre tamaños, 4,8 px CSS por paso, igual que su caja. El **teléfono no presenta el defecto** en ningún navegador.

  La composición en la lámina es `.dis` con `transform: scale(s)` y, dentro, `.cap` con una `matrix3d` proyectiva (`m14` ≈ 9,5·10⁻⁵ y `m24` ≈ −2,8·10⁻⁵ en la laptop). La causa exacta en WebKit no se ha aislado; es la decisión sellada 10 fallando en su primera prueba.
- **Edge.** Los 11 y 42 píxeles son una franja de 1–3 px de alto en el **borde superior de la pantalla del teléfono**: en +50, x 1593…1738 e y 1206…1211 @2. Son restos de antialias o del sangrado. En +70 no aparecen.

**Consola:** 0 errores de página y de consola en las 6 combinaciones.

## 5. Capturas de la lámina y consola (2.4)

Hay seis PNG a 1920×1080 @1 en `capturas-dis/lamina/`: `lam_edge_30`, `lam_edge_50`, `lam_edge_70`, `lam_webkit_30`, `lam_webkit_50` y `lam_webkit_70`. Se esperó a `window.__disListo === true` y a las imágenes completas. **0 errores** en las seis.

La línea «Para sellar» y las medidas del panel son **iguales en los dos navegadores**:

| `tel` | Teléfono (silueta) | Teléfono / laptop | Aire con el lema | Aire con la frase | Ancho del conjunto |
|---|---|---|---|---|---|
| +30 | 79,6 × 155,0 | 66 % | 106,7 | 14,0 | 395,1 |
| +50 | 91,9 × 178,9 | 76 % | 105,3 | 14,0 | 404,6 |
| +70 | 104,1 × 202,7 | 86 % | 103,8 | 14,0 | 414,2 |

En los tres, la laptop (silueta) mide **333,0 × 235,0**, hoy la relación teléfono / laptop es del 129 % y «Sombra dentro de la pantalla» es «sí».

## 6. Edge frente a WebKit (2.6)

**Diferencia dentro de la columna** (x 340…1012 e y 431…797 @1, Σ|Δ RGB| > 24):

| `tel` | Píxeles distintos | % | Σ máx |
|---|---|---|---|
| +30 | 20 936 de 245 952 | **8,512 %** | 666 |
| +50 | 22 102 | **8,986 %** | 662 |
| +70 | 23 212 | **9,438 %** | 662 |

**Cajas** de `img.ren` (`getBoundingClientRect`, x · y · ancho · alto):

| `tel` | Laptop (Edge = WebKit) | Teléfono (Edge = WebKit) |
|---|---|---|
| +30 | 433,83 · 498,30 · 418,39 · 318,33 | 772,36 · 611,97 · 123,98 · 190,09 |
| +50 | 429,05 · 496,86 · 418,39 · 318,33 | 761,58 · 585,80 · 143,06 · 219,34 |
| +70 | 424,27 · 495,44 · 418,39 · 318,33 | 750,80 · 559,66 · 162,13 · 248,58 |

**Vara (±1 px): verde.** Las cajas coinciden al centésimo.

**Observación:** esta vara mide los renders, que llevan una transformación afín (`scale`). No mide la captura con `matrix3d`, que es donde WebKit se separa. El 8,5–9,4 % de diferencia es sobre todo esa captura mal encajada. **Una puerta de WebKit para DIS-1 debería medir la `.cap`**: sus cuatro esquinas o la prueba del magenta, no solo `img.ren`.

## 7. Tiempo real

**15:51 → 15:59**, unos **8 minutos**.

**Sondas**, en el scratchpad de la sesión, fuera del repo: `lanzar_1a.cjs`, `v3.mjs`, `v3_mapa.mjs` y `v3_huecos.mjs`. Medidas en bruto en `capturas-dis/lamina/_v3_medidas.json`.

STOP · Vuelta 3 completa · sin commits · a la espera de Victor
