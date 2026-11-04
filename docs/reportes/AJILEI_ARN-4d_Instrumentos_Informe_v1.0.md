# AJILEI · ARN-4d · Instrumentos · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Fecha:** 2026-11-03
**Base:** `main` en `866c75a`, con los cambios de esta ficha sin confirmar (`866c75a-dirty`) · **Tocado:** `scripts/` y, por dictamen del rector, `docs/AJILEI_Invariantes_v1.0.md`
**Estado:** aprobada por el rector, con las cuatro desviaciones, y mapa de commits aprobado por Victor: seis commits, `4d-a` a `4d-f`. PES-1 fase 0 no empieza hasta que Victor lo diga.
**Nombre:** en su primera versión esta tanda se llamó «ARN-4b», pero la 4b ya existía y está cerrada. Su informe (`AJILEI_ARN-4_Tanda4b_Informe_v1.0.md`) no se tocó: este se guardó siempre en otra ruta.

---

## Resultado

**Las 6 varas sin veredicto ya lo tienen, y las 6 salen verdes. `tam` también, con la matriz entera. `todo` sigue rojo solo por `1.8b`, como se esperaba.**

- **Línea base:** `tactil`, `h1`, `m1`, `a1`, `f1`, `vuelo` y `tam` quedan medidas sobre este árbol. `src/` no cambió, así que el producto medido es el de `866c75a` (ver «La firma de la línea base»).
- **`h1` y `vuelo` eran tope, no cuelgue:** con una línea por celda se ve que avanzan hasta el final.
- **El perfil `commit` pasa a rojo y seguirá así hasta que PES-1 baje `1.8b`.** Es la consecuencia directa de (c). El rector lo autoriza como rojo conocido: cualquier otro rojo para el commit.

---

## La tabla (g)

Una sola corrida con `Start-Process`, en serie: 148 min 18 s, de las 16:59 a las 19:27. Código global 1. Salidas en `%TEMP%\varas-mw1ahwbv\`, con `<vara>.log` y `varas.json`.

| Vara | Código | Duración | Tope | Tope ÷ medido |
|---|---|---|---|---|
| `eslint` | 0 | 6 s | 5 min | — |
| `vitest` | 0 | 8 s | 10 min | — |
| `build` | 0 | 1 s | 5 min | — |
| `tam` | 0 | 5 min 11 s | 15 min | 2,89 |
| `todo` | **1** | 5 min 23 s | 25 min | 4,64 |
| `tactil.5` | 0 | 7 min 35 s | 15 min | 1,98 |
| `tactil.4` | 0 | 6 min 32 s | 15 min | 2,29 |
| `tactil.3` | 0 | 4 min 26 s | 15 min | 3,38 |
| `tactil.2` | 0 | 3 min 04 s | 15 min | 4,90 |
| `h1.5` | 0 | 9 min 49 s | 15 min | **1,53** |
| `h1.4` | 0 | 7 min 50 s | 15 min | 1,92 |
| `h1.3` | 0 | 5 min 54 s | 15 min | 2,54 |
| `h1.2` | 0 | 4 min 03 s | 15 min | 3,70 |
| `m1.5` | 0 | 12 min 21 s | 20 min | 1,62 |
| `m1.4` | 0 | 9 min 57 s | 20 min | 2,01 |
| `m1.3` | 0 | 7 min 26 s | 20 min | 2,69 |
| `m1.2` | 0 | 5 min 09 s | 20 min | 3,88 |
| `a1.5` | 0 | 9 min 47 s | 20 min | 2,04 |
| `a1.4` | 0 | 7 min 46 s | 20 min | 2,58 |
| `a1.3` | 0 | 5 min 55 s | 20 min | 3,38 |
| `a1.2` | 0 | 4 min 04 s | 20 min | 4,91 |
| `f1` | 0 | 15 min 03 s | 25 min | 1,66 |
| `vuelo` | 0 | 10 min 46 s | 29 min | 2,69 |

**El único rojo:** `todo`, 1 de 198 mediciones: `1.8b`, 235,6 KiB contra 200. Sigue siendo de código y es lo esperado.

**Aislamiento:** verde en todas las varas consultadas. Los logs firman `866c75a-dirty`.

### La firma de la línea base

La línea base firmada `866c75a-dirty` vale para el commit de esta tanda porque el producto medido es el mismo: **`git diff --stat 866c75a -- src/` sale vacío.** El `-dirty` solo señala los instrumentos sin confirmar.

Después de la corrida solo cambiaron comentarios, títulos de prueba (ARN-4b → ARN-4d) y `docs/`. Sobre ese árbol final, `npm run varas -- commit` sale rojo solo por `1.8b` (235,6 KiB): `eslint`, `vitest`, `build`, `guiones` y `humo` en código 0.

---

## Lo que se hizo

### a · `tam.12`, al flujo de la hoja

`medirPronto` ([tam.mjs](../../scripts/ios/tam.mjs)) abre la hoja con el ⚙, pulsa «Idioma», lee su «Pronto», cierra con Escape y espera a que hoja y velo desaparezcan. Es verde si se cumplen estas dos cosas:

- el «Pronto» sale entero y por encima del velo;
- al cerrar, el botón dorado sigue en su sitio (±1 px) y se toca.

| Celda | «Pronto» (alto de ventana) | Al cerrar |
|---|---|---|
| 1366×623 | 446,8–491,0 de 623 | Botón tocable, en su sitio |
| 412×915 | 793,4–824,4 de 915 | Botón tocable, en su sitio |
| 360×640 | 533,5–560,8 de 640 | Botón tocable, en su sitio |

Los 16 fallos de `tam.7` desaparecieron con la hoja cerrada, lo que confirma que eran de instrumento.

**Lo que cambió de significado:** la `tam.12` vieja medía el aviso de `.sal` («encima de la zona, sin tapar el botón»). En Retar ya no hay camino que lo dispare: el ⚙ abre la hoja y el avatar abre el perfil. Ese aviso sigue saliendo en otras pantallas, y su geometría ya no la mide nadie (ver «Huecos que quedan»).

### b · La matriz cuenta lo que tenía que haber

`matriz` es rojo si el barrido o las celdas medidas no son las esperadas, tamaños × estados, 301 hoy. `celdasSinMedir` sustituye al punto `no medidas`, que solo veía las celdas que llegaron a existir.

| Corrida | `tam.7` | `tam.12` | `matriz` | Celdas |
|---|---|---|---|---|
| **Control rojo:** la `tam` vieja con la matriz nueva | ✗ (16) | ✗ (2) | **✗ (19)** | **282 de 301** |
| La `tam` nueva | ✓ | ✓ | ✓ | **301 de 301** |

El control usó el bloque viejo durante una corrida. El archivo se restauró y se comprobó por huella SHA-256. `tam.test.js` deja el mismo caso en vitest. Log: `control-tam-vieja.log`, en el scratchpad de la sesión.

### c · `1.8b` en `commit`

Vara nueva, [peso.mjs](../../scripts/arnes/peso.mjs) con [pesoCore.mjs](../../scripts/arnes/pesoCore.mjs): lee `dist/`, sigue los imports estáticos y aplica gzip de nivel 9, sin navegador.

- **Cuánto añade:** **110 ms** a un perfil de 13 min 44 s. En la tabla del orquestador sale como «0 s».
- **Coincide con el navegador:** 235,6 KiB en las dos, Δ 0,0 KiB, con la línea nueva `1.8f` de `diagPUE 1.8`.
- **Reparto actual:** JS 198,5 · CSS 30,4 · HTML 2,1 · resto 4,6.

**Su límite:** las dos imágenes del primer pintado no se deducen del HTML; van por nombre en `IMAGENES_DEL_PINTADO`.
- Si una desaparece, es error de instrumento.
- Si entra una imagen **nueva** en el primer pintado, esta vara no la ve. La ve `diagPUE 1.8`, en `completo`, y `1.8f` enseña la diferencia, pero **`1.8f` informa y no pone rojo**.

### d · Topes

| Vara | Antes | Ahora | Medido | ≥ 1,5 × |
|---|---|---|---|---|
| `m1` | 15 min, cortada | 4 partes, 20 min | 34 min 53 s en total; la mayor, 12 min 21 s | Sí, y cada parte < 20 min |
| `a1` | 15 min, cortada | 4 partes, 20 min | 27 min 32 s en total; la mayor, 9 min 47 s | Sí, y cada parte < 20 min |
| `f1` | 15 min, cortada | 25 min | 15 min 03 s | Sí: 22 min 35 s |
| `u1` | 15 min | 23 min | 14 min 43 s, en la línea base | Sí: 22 min 05 s |
| `a2` | 15 min | 22 min | 14 min 34 s, en la línea base | Sí: 21 min 51 s |
| `tactil` | 15 min, cortada | 4 partes, 15 min (**desviación 1**) | 21 min 37 s en total; la mayor, 7 min 35 s | Sí |

`u1` y `a2` no estaban en la lista del (g): el tope sube sobre lo medido en la línea base y no se volvieron a correr.

**Mis proyecciones estaban altas.** Dije `m1` ~50 min, `a1` ~40 y `tactil` ~27; miden 35, 28 y 22. Proyecté desde las primeras mesas, y la mesa 5 tarda unas 2,4 veces lo que la mesa 2.

**`completo` tardará unas 7 h 13 min:** es lo medido antes, cambiando los 90 min de los seis cortes por los 137 min reales. Es un cálculo, no una corrida.

### e · Una línea por celda

- **`h1`:** `h1 T5 1024x768 · frames=282 · OK`, una por celda.
- **`vuelo`:** ya imprimía por escenario, pero un escenario son hasta 40 manos y esa era la parte muda. Ahora imprime una línea por mano: `vuelo humano · mano 12/40 · cerró: win`.

### f · Veredictos caducados y firmados

- Antes de lanzar una vara, su JSON pasa a `.caducado`. Comprobado en `revive`: a los 6 s de corrida `diag_revive.json` no existía y sí su `.caducado`. Así, una vara cortada no deja nada que pase por actual.
- `report.commit` en los cuatro arneses, y el commit en la línea final de cada log, en la tabla y en `varas.json`. Lleva `-dirty` si hay cambios sin confirmar.
- La tabla lleva la columna `Tope`.

**Trampa nueva:** `diag_m1.json` guarda solo la última parte. Los veredictos enteros están en `diag_m1.5.json`, `diag_m1.4.json`, etc.

### Las pruebas

Eslint en 0, vitest 95/95 archivos y 2173 pruebas, build y guiones en verde. Repetido al final, tras los últimos comentarios: `npm run varas -- rapido` → código 0.

---

## Desviaciones

Aprobadas por el rector las cuatro. El paso a `.caducado`, renombrar y no borrar, es lo correcto.

**1. `tactil` va partida, no solo subida.** La ficha dice subir a ≥ 1,5 × lo medido: 21 min 37 s × 1,5 = 32 min 26 s. Eso rompe el contrato «todo tope bajo 30 min» de `orquesta.test.js` (A4). Preferí no debilitar una prueba. Hizo falta que `tactil 5` filtre por mesa, como ya hacían `h1`, `m1` y `a1`.

**2. `h1` va partida y `vuelo` sube a 29 min, sin que la ficha lo pida.** Sin esto volverían a cortarse: `h1` mide 27 min 36 s.
- `h1.5` queda justa: su tope es 1,53 × lo medido.
- **`vuelo` puede volver a cortarse:** busca una victoria humana sin semilla, hasta 40 manos, a unos 54 s cada una. Aquí ganó en la mano 12 (10 min 46 s). 29 min dan para unas 32 manos.

**3. El (f) cubre más de lo pedido, y marca en vez de borrar.** La trampa era la misma en `diagPUE`, `diagSAL` y `diagCEL0`, así que los cubre también. Además, cada parte y cada modo de `diagPUE` guarda su copia (`diag_todo.json`): antes, la vara siguiente pisaba el veredicto. Marcar conserva lo anterior, sin borrar nada.

**4. El lanzamiento fue con `node` directo.** Una primera orden de `Start-Process` por un `.cmd` fue denegada por permisos y no arrancó nada. Sigue siendo `Start-Process`, como pide la ficha.

---

## Huecos que quedan

### Pendientes con dueño

| Pendiente | Qué falta | Cuándo |
|---|---|---|
| `vuelo` sin semilla | Busca una victoria humana sin semilla: hasta 40 manos, y 29 min dan para unas 32 | Después de MOT-1 |
| `1.8b` en `aislado --perfil=commit` | Tiene su propia lista de pasos en `aislado.mjs` y no lleva esta vara | Al cerrar PES-1 |
| El hueco de cuenta de `runWebkit` | Una celda perdida no se cuenta en la matriz, aunque un error sí la pone roja por `consola` | En la sesión de iOS |

### El aviso de `.sal`, sin geometría medida

**¿`rnk` o `correo1d` miden «encima de la zona, sin tapar el botón»? No.** Es lectura de código, sin corridas. No se arregla en esta tanda.

- **`rnk`, no:** [rnk.mjs:403-404](../../scripts/rnk/rnk.mjs#L403-L404) solo compara el texto del aviso.
- **`correo1d`, no:** [correo1d.mjs:301-304](../../scripts/cfg/correo1d.mjs#L301-L304) mide el borde izquierdo y el derecho (`dentro`), y ni la zona ni el botón.
- **Tampoco las demás lecturas del aviso:** [cfg.mjs:799](../../scripts/cfg/cfg.mjs#L799), [diagSAL.mjs:745](../../scripts/diagSAL.mjs#L745) y [diagDSK.mjs:1833](../../scripts/diagDSK.mjs#L1833) miran el texto o si está encendido.
- **Lo que se queda sin vigilar:** la regla de [salas.css:1666](../../src/styles/salas.css#L1666), en pantallas donde el aviso sigue saliendo, como el fallo de unirse en [SalaOpciones.jsx:230](../../src/screens/SalaOpciones.jsx#L230). [tam.mjs:314](../../scripts/ios/tam.mjs#L314) aún recoge la caja del aviso, pero nada la juzga.

### Sin dueño

- **Sin dueño:** `tab.resto` (81 %), `luz` (80 %), `z1` (77 %) y `msg` (75 %) siguen justas de tope. La ficha no las nombra.

---

## Lo que decidió el rector

1. **`docs/`, sí.** `AJILEI_Invariantes_v1.0.md` queda al día en los cuatro sitios:
   - §3, `commit`: lleva `1.8b` y su rojo conocido;
   - §3, `completo`: unas 7 h 13 min, calculadas, y las varas por mesas;
   - la fila de `diagDSK tam`: el «Pronto» de la hoja, el punto matriz, 43 tamaños (decía 39) y el hueco del aviso;
   - INV-30: `scripts/arnes/peso.mjs` como segundo vigilante, y hoy en rojo.
2. **`tactil` y `h1` siguen partidas:** se mantiene el contrato de 30 min.
3. **`1.8f` sigue informativa** hasta PES-1.
4. **Se confirma ahora**, antes de PES-1.

**Siguiente:** PES-1 fase 0, cuando Victor lo diga. Sin prueba en teléfono de esta tanda, porque `src/` no cambia.
