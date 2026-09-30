# AJILEI · DIS-1 · Fase 2 · Integración en la Portada · Informe · v1.0

**Ficha:** `AJILEI_DIS-1_Fase2_Integracion_v1.0.md` · **Fecha:** 2026-09-30 · **Base:** `main` en `59fa46d`
**Ejecuta:** Claude Code
**Terreno:** `npm run build` y `npx vite preview --port 4173 --strictPort`, nunca el servidor de desarrollo. Navegadores: Edge 154.0.4258.37 y WebKit 26.5 (playwright-core 1.62.1).

Sin commits y sin `git add`. **Ningún protegido abierto** (`git diff --name-only` no contiene ninguno de los seis). No se borró nada.

> **Resumen:**
> - **Reencaje v3.2:** 10,0 s en total. El derivado web pasa de 67,6 s a **1,76 s** en la laptop y de 14,7 s a **0,84 s** en el teléfono. Los WebP son **idénticos al byte** a los de la 1c, los mismos que Victor aprobó en la lámina 13, y el borde tiene alfa 0.
> - **Escena 5:** son dos `<img>` con ancho y alto explícitos, sin marco CSS, sin giro y sin `matrix3d`. La geometría sale de los JSON por un script y llega al CSS como constantes en `cqh`, sin cálculo en JS.
> - **Contrato de la lámina:** se cumple con **0,22 px** como máximo (±1 permitido). **WebKit da las mismas cajas que Edge**, con Δ de 0 a 0,03 px.
> - **Modo `dis`:** **68 puertas, 0 rojas**, en Edge y WebKit. `capvis` queda retirado, y `1.3a` y `1.8a` migrados.
> - **Aparatos:** ya no se descargan donde la escena no existe ni con quietud. Al terminar la escena **se desvanecen con ella**.
> - **`1.8b`:** 224 663 → **224 698 B**, +35 B (+0,03 KiB). Sigue en 219,4 KiB, el rojo conocido.
> - **Línea base:** build limpio · vitest **1056/1056** · lint **21** (igual) · `diagPUE` **182 verdes y 1 rojo**, el `1.8b` conocido.

---

## 1. Reencaje con el script v3.2 (§2.1)

**Script:** `scripts/dis1/gen_dispositivos.py`, reemplazado por el adjunto v3.2. Los únicos cambios frente a la v3.1 son los de la ficha:
- la función nueva `reducir_eje`, con sumas acumuladas;
- `derivado_web`, que la usa en lugar de los dos `tensordot`.

`matriz_area` sigue en el archivo, sin uso.

**Orden:** la de la ficha. Log en `capturas-dis/final/_log_reencajar_v32.txt`:

```
[DIS-1] laptop: reencajado · captura 4.57 s · web 887×611 47874 B en 1.76 s
[DIS-1] telefono: reencajado · captura 2.38 s · web 330×522 27752 B en 0.84 s
[DIS-1] listo (reencajado)
--- código 0 · señal null · error - · 16:58:14 → 16:58:24 · 10.0 s ---
```

**Código 0.** El log tiene 0 líneas `Sample` o `Fra:`: no hubo render de Cycles.

| | `tiempos_s.web` en la 1c | v3.2 | `web.bytes` | Alfa máximo del borde (fila y columna exteriores) |
|---|---|---|---|---|
| laptop | 67,57 s | **1,76 s** | 47 874 | **0** |
| teléfono | 14,71 s | **0,84 s** | 27 752 | **0** |

**Idénticos al byte:**
- `laptop_web.webp` (`134f4e4a…`) y `telefono_web.webp` (`8d842b28…`) son los mismos que produjo la v3.1 en la 1c y que usa la lámina 13 aprobada;
- los `*_captura.png` siguen idénticos (`34f6fc7e…` y `37c9ceb5…`);
- las comprobaciones del render (nada asoma, derivados) dan lo mismo que en la 1c. La rendija redefinida del teléfono sigue en 39, el contorno ya explicado en la 1c §3.2.

## 2. Archivos creados y tocados

### 2.1 Creados

| Archivo | Líneas o bytes | Qué es |
|---|---|---|
| `src/assets/portada/dis_laptop.webp` | 47 874 B | copia de `capturas-dis/final/laptop_web.webp` |
| `src/assets/portada/dis_telefono.webp` | 27 752 B | copia de `telefono_web.webp` |
| `maestras/dis1/laptop.json` | 109 | copia del JSON reencajado |
| `maestras/dis1/telefono.json` | 109 | ídem |
| `maestras/dis1/contrato.json` | 167 | las cajas objetivo de la lámina v1.3 en sus 7 casos |
| `maestras/dis1/LEEME.md` | 45 | origen, dónde están los PNG de 16 bits y cómo regenerar con `--reencajar` |
| `scripts/dis1/geometria_dis.mjs` | 110 | genera el bloque de geometría de `portada.css` desde los JSON; con `--escribir` lo reescribe y sin él comprueba (sale 1 si no está al día) |
| `scripts/dis1/contrato_lamina.mjs` | 51 | abre la lámina 13 en Edge y escribe `contrato.json` |

### 2.2 Tocados (`git diff --stat`)

```
 .gitignore              |   1 +      (capturas-dis/, de la Fase 1a)
 scripts/diagPUE.mjs     | 308 ++++++++++++++++++++++++++++++++++++++++--------
 src/screens/Portada.jsx |  41 ++++---
 src/styles/portada.css  | 140 +++++++++-------------
 4 files changed, 344 insertions(+), 146 deletions(-)
```

**`scripts/dis1/gen_dispositivos.py`** está sin seguimiento: reemplazado por la v3.2 (899 líneas).

**`src/styles/portada.css`** (todo dentro de los rangos autorizados):
- `:534-625`: la escena 5 base, sustituida (ahora `:534-597`). Contiene `.pue-duo` (más `container-type: size`), el bloque generado `DIS-1:geometria` (`:559-578`), `.pue-dis`, las dos cajas, las entradas y los keyframes `pue-dis-alzar` y `pue-esfumar`. Salen de la hoja:
  - `.pue-laptop`, `.pue-laptop-pantalla`, `.pue-laptop-base`, `.pue-telefono` y `.pue-pantalla`;
  - los keyframes `pue-alzar` y `pue-alzar-pc`, que solo usaba esta escena.
- `:801-811` (≤ 900 px): el reposo del teléfono pasa a 0 y el relevo, a las clases nuevas.
- `:886` (vertical compacto): se quitan las dos líneas de alto de los marcos. El 82 % vive en el bloque generado.
- Ni otras escenas, ni `.pue-escenario`, ni el rotor. Sin `!important`.

**`src/screens/Portada.jsx`:**
- `:16-20`: los imports de `mesav` y `mesapc` pasan a `dis_laptop` y `dis_telefono`;
- `:199-203`: la condición `aparatos`;
- `:498-516`: la escena 5, ahora con dos `<img>`.

**`scripts/diagPUE.mjs`:**
- la cabecera;
- `WEB_DIS` y la tinta de `1.3a` (`:108-137`);
- la expresión de `1.8a` (`:1104-1113`);
- el modo `dis` en lugar de `capvis` (`:1159-1401`);
- el `import` gana `webkit`.

## 3. Cómo quedó la regla

### 3.1 Geometría (§2.3)

**`.pue-duo` es un contenedor de tamaño** (`container-type: size`), del alto del escenario: `100cqh` = alto del escenario. Es el mismo recurso que ya usa la moneda de la escena 4 (MON-2). Cada `<img class="pue-dis">`:
- va en `position: absolute`;
- lleva **`width` y `height` explícitos**;
- sitúa su borde izquierdo en `left: calc(50% + X)` respecto al centro de `.pue-duo` y su borde inferior en `bottom: Y` respecto al pie.

Nada depende de la proporción de un hijo (Fase 0 §I-1). Los cuatro valores de cada aparato son custom properties que escribe `scripts/dis1/geometria_dis.mjs` desde los bloques `web` de los JSON, con las fórmulas de la lámina v1.3.

**Escritorio (≥ 901 px):**
- La composición de la lámina a 1920 (laptop de 234 px de silueta, teléfono +30 %, solape 0,22 y bajada 0,06) se expresa en `cqh`: 300 px = 100 cqh. Así escala en proporción a `alto / 300`.
- Se ancla al centro de `.pue-duo`. En vertical, **la unión de siluetas queda 8 px por debajo del pie** (escalados). A 1920 el pie está a 22,0 px de la frase y la lámina deja el conjunto a 14 px de ella; 22 − 14 = 8.
- La unión de siluetas queda centrada, y por eso el eje de `1.3a` sale a 0,01 px.

**Móvil (≤ 900 px):**
- **Teléfono:** silueta = 100 % del alto del escenario.
- **Laptop:** `--dis-u = min(88 % del alto / alto de la silueta, (88 % del alto − 10 px) · 1,16 · 16/9 / ancho de la silueta)`, es decir, el 88 % sin pasar del ancho de la base de hoy. En vertical con ≤ 700 px de alto usa el 82 %. En los casos medidos siempre manda el alto.
- **Los dos:** pie a 6 px y centrados.

**Resultado a 1920, antes y después:**

| | Laptop (izquierda, arriba, derecha, abajo) | Teléfono |
|---|---|---|
| Lámina (contrato) | 452,27 · 529,75 · 820,27 · 783,24 | 779,88 · 623,73 · 886,01 · 791,60 |
| Producción, Edge | 452,06 · 529,73 · 820,05 · 783,22 | 779,67 · 623,72 · 885,80 · 791,58 |
| Producción, WebKit | idéntica a Edge | idéntica a Edge |

Los 0,2 px en x son la diferencia entre el centro de la columna de la lámina (676) y el de `.pue-duo` real (675,797).

**Una trampa medida.** A 360×640, fuera de la escena 5, el lema y el escenario caen 1,4 px más abajo que en la lámina. La causa es que la frase de la escena 5 ocupa una línea más y la rejilla centrada desplaza todo. **Con la escena 5 viva, los anclajes coinciden con la lámina a la centésima** (lema 250,41 · pie 396,41 · frase 418,41). El modo `dis` mide siempre con la escena viva.

**El bloque generado,** tal como está en `portada.css`:

```css
.portada-lienzo .pue-duo {
  --dis-lap-x: -74.5767cqh; --dis-lap-b: -2.9794cqh; --dis-lap-w: 122.6659cqh; --dis-lap-h: 84.497cqh;
  --dis-tel-x: 34.6281cqh; --dis-tel-b: -5.769cqh; --dis-tel-w: 35.3757cqh; --dis-tel-h: 55.9579cqh;
}
@media (max-width: 900px) {
  .portada-lienzo .pue-duo {
    --dis-tel-x: -34.5234cqh; --dis-tel-b: calc(6px - 6.0282cqh); --dis-tel-w: 68.7385cqh; --dis-tel-h: 108.7319cqh;
    --dis-u: min(0.156023cqh, (88cqh - 10px) * 0.00257842);
    --dis-lap-x: calc(var(--dis-u) * -464.71); --dis-lap-b: calc(6px - var(--dis-u) * 24.59);
    --dis-lap-w: calc(var(--dis-u) * 887); --dis-lap-h: calc(var(--dis-u) * 611);
  }
}
@media (orientation: portrait) and (max-height: 700px) {
  .portada-lienzo .pue-duo { --dis-u: min(0.145385cqh, (82cqh - 10px) * 0.00257842); }
}
```

`node scripts/dis1/geometria_dis.mjs` comprueba ahora mismo «al día».

### 3.2 Entradas, relevo y salida (§2.4)

**Entradas:**
- **Escritorio:** `pue-dis-alzar 0.55s ease-out` con retardo de 0,1 s en la laptop y 0,45 s en el teléfono, los de hoy.
- **Móvil:** el relevo S4. El teléfono lleva el mismo `pue-dis-alzar` a 0,1 s más `pue-esfumar 0.4s` a 2 s, y la laptop, `pue-dis-alzar` a 2,2 s.
- `pue-dis-alzar` es el `pue-alzar` de antes **sin** el `translateX(-50%)` ni el giro de −3° (S10): solo opacidad y el rebote vertical de 26 / −8 / 2 px.

**Salida (S5), el mecanismo:**
- **El reposo de cada aparato es visible** (`opacity: 1`) y la entrada rellena hacia atrás (`animation-fill-mode: both`), así que durante el retardo sigue invisible.
- Al quitarse `.pue-activa` se va la animación y el aparato se queda en su reposo, **el mismo valor que tenía al final**. Así se desvanece con el contenedor (0,7 s) en lugar de apagarse de golpe.
- En móvil el reposo del teléfono es 0: salió con el relevo y no reaparece al irse la escena.
- Sin JS y sin temporizadores nuevos.

Medido a unos 4 160 ms de la activación: cada aparato visible mantiene opacidad propia 1 mientras el contenedor va por 0,6–0,8. Antes era 0 de golpe (Fase 0 §C2).

**Descargas (S6):** `const aparatos = pesadasTardias && !quieto && !escenaOculta`, con el mismo `ESCENA_OCULTA` y la misma quietud que la moneda (MON-2.1). Las imágenes se importan desde `src/assets/portada/` y llevan hash, así que caen en la zona `immutable`. Su `src` solo se asigna con `aparatos`. Medido:
- a 1920 y en el S25 se piden a ~2 760 ms, las dos;
- en el S25 horizontal y con quietud, **ninguna petición**.

**Quietud (S7):** la escena 5 sigue sin verse, porque el rotor se queda en la escena 1. Si llegara a verse, la regla de quietud (`animation: none`) dejaría los aparatos en su reposo:
- en escritorio, visibles los dos;
- en móvil, solo la laptop, que es el estado final del relevo.

No quedan invisibles, como pasaba antes (Fase 0 §C2).

**Accesibilidad:** `alt=""`, dentro del escenario `aria-hidden`, con `decoding="async"` y `draggable={false}`, como la moneda.

## 4. Puertas del modo `dis`

**Modo:** `node scripts/diagPUE.mjs dis`; entra en `todo`. Una sonda dentro de la página vigila la clase de la quinta `.pue-esc`. Desde la activación muestrea por cuadro la opacidad del contenedor y de cada aparato, y fotografía las cajas a +1,3 s y +3,3 s. Los tiempos son los del documento, sin latencia de Playwright. En WebKit espera a `.pue-escenario` antes de armarse.

**Resultado:** 68 puertas, **68 verdes**.

| Caso | Nav | `contrato` (Δ máx) | `cabe` | `holgura` lema / frase | `relevo` | `salida` (opacidad propia) | `perezoso` | `errores` |
|---|---|---|---|---|---|---|---|---|
| 1920×1080 | Edge | lap 0,22 · tel 0,21 | ✓ x 459…883 | 107,9 / 14,0 | lap 439 · tel 789 ms | 1 y 1 | 2 761 ms ×2 | 0 |
| S25 360×704 @3 | Edge | tel 0,02 · lap 0,04 | ✓ | tel 22,2 / 28,0 · lap 40,2 / 28,0 | tel↑438 ↓2398 · lap↑2538 · solape 180 | lap 1 | 2 771 ms ×2 | 0 |
| 390×844 @3 | Edge | tel 0,07 · lap 0,04 | ✓ | tel 27,8 / 28 · lap 46,0 / 28 | ídem | lap 1 | — | 0 |
| 360×640 @3 | Edge | tel 0,02 · lap 0,05 | ✓ | tel **14,0** / 22 · lap 37,8 / 22 | ídem | lap 1 | — | 0 |
| 901×1000 | Edge | — | ✓ x **54,1**…449 | 100,4 / 14,6 | 439 · 789 | 1 y 1 | — | 0 |
| 1366×768 | Edge | — | ✓ | 77,1 / 16,3 | 438 · 788 | 1 y 1 | — | 0 |
| 1440×850 | Edge | — | ✓ | 85,4 / 15,7 | 439 · 788 | 1 y 1 | — | 0 |
| 768×1024 @2 | Edge | — | ✓ | tel 35,0 / 28 · lap 57,1 / 28 | tel↑438 ↓2398 · lap↑2538 · solape 180 | lap 1 | — | 0 |
| 1920×1080 | WebKit | (`webkit` Δ 0) | ✓ | 107,9 / 14,0 | 480 · 792 | 1 y 1 | — | 0 |
| S25 360×704 | WebKit | (`webkit` Δ 0,03 / 0,03) | ✓ | igual que Edge | tel↑448 ↓2441 · lap↑2550 · solape 212 | lap 1 | — | 0 |
| 360×640 | WebKit | (`webkit` tel Δ 0,03) | ✓ | igual que Edge | tel↑**500** ↓2427 · lap↑2565 · solape 144 | lap 1 | — | 0 |
| S25 h 780×360 | Edge | `oculto`: **0 peticiones** en 6 s · escenario `display: none` | | | | | | 0 |
| 1920 con quietud | Edge | `oculto`: **0 peticiones** en 6 s · escena activa 0 | | | | | | 0 |

**Varas:**
- `contrato` y `webkit`: ≤ 1 px.
- `holgura`: ≥ 10.
- `relevo`:
  - escritorio, los dos a 1 antes de 1 000 ms;
  - móvil, teléfono a 1 en ≤ 600 ms y a 0 en ≤ 2 500 ms, laptop a 1 en ≤ 2 700 ms, solape < 300 ms.
- `salida`: a 4 150 ms o más, opacidad propia ≥ 0,85.
- `perezoso`: las dos a ≥ 2 400 ms.

**Notas:**
- **901×1000:** la franja donde la base de la laptop se salía 7,9 px (Fase 0 §B5). Ahora la tinta con sombra empieza en x = 54,1.
- **Margen más justo:** el teléfono de WebKit a 360×640 llega a 1 a los 500 ms frente a una vara de 600, con los 13 contextos corriendo en paralelo. En Edge, a los 438 ms.
- **Aire más justo:** 14,0 px, con la frase en escritorio y con el lema a 360×640 con el teléfono. Es lo que selló la lámina.

## 5. `1.8b` antes y después

| | Antes (base, mismo build sin DIS-1) | Después |
|---|---|---|
| `1.8b` en el cable | **224 663 B** (219,4 KiB) | **224 698 B** (219,4 KiB) |
| `index-*.css` en el cable | 34 150 B | 34 204 B (+54) |
| `index-*.js` en el cable | 183 644 B | 183 628 B (−16) |
| Documento | 2 181 B | 2 178 B |

**+35 B (+0,03 KiB)**, dentro del límite de +1,0 KiB. Sigue en rojo (219,4 frente a 200), el rojo conocido desde CAP-1. Los renders no entran en `1.8b`: viajan a los ~2,6–2,8 s, con `1.8a` en verde.

## 6. Consumidores de `mesapc` y `mesav` (§2.5)

- **Imports en `src/`:** ninguno.
- **`npm run build`:** `dist/assets/` ya no contiene `mesapc-*.webp` ni `mesav-*.webp`. Contiene `dis_laptop-CevOMGWU.webp` (47,87 kB) y `dis_telefono-J476TM6c.webp` (27,75 kB).
- **Productor:** los archivos solo aparecen como salida de `scripts/gen-portada-assets.mjs` (`:100-111`), que no se ha tocado.
- **Quedan sin consumidor** `src/assets/portada/mesapc.webp` y `mesav.webp`, junto con sus dos trabajos del generador. No se borran; la limpieza queda para una decisión aparte.
- **Siguen en uso:** las maestras `maestras/portada/mesapc.png` y `mesav.png`, que son la entrada de `gen_dispositivos.py` y de CAP-1.

## 7. Línea base

| Prueba | Resultado |
|---|---|
| `npm run build` | limpio (solo el aviso de siempre de trozos > 500 kB) |
| `npx vitest run` | **1056/1056**, 37 archivos |
| `npx eslint .` | **21** (20 errores y 1 aviso), los mismos que antes. Los archivos tocados y los nuevos dan 0 |
| `node scripts/diagPUE.mjs` (todo) | **182 verdes y 1 rojo**, el `1.8b` conocido |

**Sobre las cifras de `diagPUE`:** la Fase 0 tenía 122 + 1. Salen las 8 de `capvis` y entran las 68 de `dis`. `1.3a esc5` está verde en los cuatro viewports: 1920 con eje 0,01 y holgura 14,0; 390×844 con 28,0; 360×640 y 320×568 con 22,0.

## 8. Capturas para Victor

En `capturas-dis/fase2/`, con la escena 5 viva:

| Archivo | Navegador | Viewport | Instante |
|---|---|---|---|
| `edge_1920x1080.png` | Edge | 1920×1080 @1 | +1,3 s |
| `edge_S25_360x704_fase_telefono.png` | Edge | 360×704 @3 | +1,3 s |
| `edge_S25_360x704_fase_laptop.png` | Edge | 360×704 @3 | +3,3 s |
| `webkit_1920x1080.png` | WebKit | 1920×1080 @1 | +1,3 s |

Las cuatro con 0 errores.

## 9. Estado de git

**Tocados por esta campaña (DIS-1):**

```
 M .gitignore                         (capturas-dis/, Fase 1a)
 M scripts/diagPUE.mjs
 M src/screens/Portada.jsx
 M src/styles/portada.css
?? maestras/dis1/                     (laptop.json, telefono.json, contrato.json, LEEME.md)
?? scripts/dis1/                      (gen_dispositivos.py, geometria_dis.mjs, contrato_lamina.mjs, __pycache__/ ← ver abajo)
?? src/assets/portada/dis_laptop.webp
?? src/assets/portada/dis_telefono.webp
?? docs/reportes/AJILEI_DIS-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_DIS-1_Fase1a_Informe_v1.0.md
?? docs/reportes/AJILEI_DIS-1_Fase1a_Vuelta2_Informe_v1.0.md
?? docs/reportes/AJILEI_DIS-1_Fase1a_Vuelta2_Informe_v1.1.md
?? docs/reportes/AJILEI_DIS-1_Fase1a_Vuelta3_Informe_v1.0.md
?? docs/reportes/AJILEI_DIS-1_Fase1a_Vuelta4_Informe_v1.0.md
?? docs/reportes/AJILEI_DIS-1_Fase1b_Informe_v1.0.md
?? docs/reportes/AJILEI_DIS-1_Fase1c_Informe_v1.0.md
?? docs/reportes/AJILEI_DIS-1_Fase2_Informe_v1.0.md
?? docs/reportes/dis1-fase0/
```

**Residuos conocidos, ajenos a DIS-1** (ya estaban antes):
- `docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md`
- `docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md`
- `laminas/mon1/_entorno.txt`, `laminas/mon1/lamina.html` y `laminas/mon1/tiempos.json`
- `scripts/_cel1bFila.mjs`

**Residuo de esta campaña que no debe entrar:** `scripts/dis1/__pycache__/`. Es la caché de Python que dejó mi sonda de perfil de la 1c al importar `gen_dispositivos.py`. No se borra. Victor lo quita a mano, o hay que dejarlo fuera del `git add`.

**Fuera de git** (`capturas-dis/` está ignorada): `final/`, `lamina12/`, `lamina13/`, `fase2/` y los logs de reencaje.

## 10. Mapa archivo → commit propuesto

Sin `git add`. Solo para revisar antes de la ficha de commits.

| # | Commit propuesto | Archivos |
|---|---|---|
| 1 | **DIS-1a · recursos:** renders, traza y script | `maestras/dis1/laptop.json`, `telefono.json`, `contrato.json` y `LEEME.md` · `src/assets/portada/dis_laptop.webp` y `dis_telefono.webp` · `scripts/dis1/gen_dispositivos.py`, `geometria_dis.mjs` y `contrato_lamina.mjs` (**sin** `__pycache__/`) · `.gitignore` (`capturas-dis/`) |
| 2 | **DIS-1b · la escena 5 con los renders** | `src/styles/portada.css` · `src/screens/Portada.jsx` |
| 3 | **DIS-1c · arnés:** modo `dis`, `capvis` retirado, `1.3a` y `1.8a` migrados | `scripts/diagPUE.mjs` |
| 4 | **DIS-1d · informes** | `docs/reportes/AJILEI_DIS-1_*` (Fase 0, 1a, sus vueltas 2 a 4, 1b, 1c y 2) · `docs/reportes/dis1-fase0/` |

**Aviso de orden:** el commit 2 importa los WebP del 1, y el 3 lee `maestras/dis1/*.json` del 1. Cada commit compila y mide si se aplican en ese orden.

## 11. Tiempo real

**16:57 → 17:21**, unos **24 minutos**, dentro del presupuesto de 60–90.

**Sondas**, en el scratchpad de la sesión, fuera del repo:
- `f2_anclas.mjs` y `f2_anclas5.mjs`: los anclajes, con y sin la escena 5 viva;
- `f2_640.mjs`: la trampa de 360×640;
- `f2_cajas.mjs`: la primera medida contra el contrato;
- `f2_comprob.mjs`: las comprobaciones del reencaje;
- `f2_capturas.mjs`: las capturas de §8.

STOP · Fase 2 completa · sin commits · a la espera de Victor
