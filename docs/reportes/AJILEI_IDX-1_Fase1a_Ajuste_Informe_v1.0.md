# AJILEI · IDX-1 · Fase 1a · Ajuste · Informe v1.0

**Ficha:** `AJILEI_IDX-1_Fase1a_Ajuste_v1.0.md` (2026-09-25) · **Fecha:** 2026-09-25 · **Base:** `5311a32` (main) · sin commits

---

## Estado de las 40 cartas

| Estado | Cartas |
|---|---|
| ok | **31** |
| encogida | **9** (8 con el dibujo encogido y el 4 de oros con las monedas recolocadas) |
| necesita decisión | **0** |
| borrado incompleto | **0** |

## Qué cambió

| # | Decisión | Qué se hizo |
|---|---|---|
| A-1 | Tinta en x = 976 | Se retiraron el anclaje por caja de avance, el argumento `--anclaje` y `ANCLAJES`. **La tinta de las 40 empieza en y = 93 y acaba en x = 976**, el 1 y el 11 incluidos. Queda a 22 px del marco interior por arriba y a 24 por la derecha, y hay una prueba que lo fija |
| A-2 | Verificación sobre la carta final | El anillo de 8 px se revisa **después de encoger o recolocar y antes de pintar el número** (el número de los oros es del mismo rojo y caería dentro del anillo superior). Un píxel cuenta como resto solo si está a ≤ 12 por canal de la recta #F5EDD8 → #CF142B y no es crema pura (`esRestoNumero`). El criterio «rojizo» ya no existe. **Hay 0 restos en los 80 anillos** |
| A-3 | Píxeles sueltos | Al medir la holgura se quitan las componentes de menos de 10 px (`sinComponentesPequenas`). Solo afecta a la medida: el encogido usa la máscara completa |
| A-4 | Máscara de la ficha | Sin cambios |
| A-6 | 12 % exacto | Sin cambios: tinta de **178 px** en las figuras (objetivo 178,9); de 238–239 px en el 1–7 (objetivo 238,6) |
| A-8 | V-2 como regla | El comentario de `VENTANA_ENCOGIDO` en `idxCore.mjs` la describe como regla, citando A-8 |

## Las encogidas

Ordenadas por holgura final. La holgura se mide en px del maestro y la regla es ≥ 18.

| Carta | Factor | Holgura antes → después |
|---|---|---|
| 5 de copas | 0,93 | 1,4 → **18,0** px |
| 4 de bastos | 0,91 | 0 → 18,7 px |
| 5 de bastos | 0,91 | 0 → 19,0 px |
| 7 de bastos | 0,96 | 13,6 → 19,9 px |
| 5 de oros | 0,90 | 0 → 20,0 px |
| 6 de bastos | 0,96 | 6,1 → 21,6 px |
| 4 de espadas | 0,90 | 0 → 22,5 px |
| 4 de copas | 0,90 | 0 → 22,7 px |
| 4 de oros | monedas al 0,84 | 0 → 37,3 px |

Ninguna se acerca al suelo de 0,85; la que más baja se queda en 0,90.

## El 7 de copas

**Sin encoger: factor 1, holgura 18,2 px, estado `ok`.** Con la tinta en 976, el número queda 11,5 px más a la derecha que en la lámina, y la copa de la esquina ya cumple la regla sin tocar el dibujo. Victor lo aprobó encogido al 94 % en la lámina. Si lo quiere igual, hoy **no** sale de la regla (ver riesgo 1).

## Los tres puntos de §2.5

Comprobados en la hoja a 240 px y en `informe.json`:

1. **El 1 y el 11 terminan en el mismo borde que el resto.** La columna derecha de la tinta es 976 en las 40 cartas.
2. **El 4 de oros no lleva marca de borrado:** 0 restos, estado `encogida`, por las monedas.
3. **`uno_espada` queda sin tocar:** factor 1 y holgura 300,2 px. El píxel suelto de (860,128) ya no cuenta, y además con la tinta en 976 el «1» ni siquiera cae encima de él.

**La hoja:** `capturas-idx/hoja.html`, 6,41 MB. Comprobada a 412×915 con DPR 2,625: 280 imágenes, ninguna rota, y sin desplazamiento horizontal de la página. La lista «Para revisar» trae solo las 9 encogidas.

## Reproducibilidad (criterio A-5)

**Dos corridas completas seguidas: las 40 cartas son iguales al byte.** Diferencia máxima 0/255, así que se cumple A-5 (≤ 2/255) con margen. Edge 153.0.4234.48, registrado en `informe.json`.

## Línea base

| Qué | Cifra |
|---|---|
| `npm test` | **35 archivos · 989 pruebas · 989 aprobadas** (963 + 26 de `testIdxCore`; una más que en la 1a porque entra la prueba de A-3, y las de anclaje y rojizo se sustituyeron) |
| `npx eslint .` | **21 problemas (20 errores, 1 aviso)**, la línea base. Los archivos de IDX-1 no tienen ninguno |
| Protegidos | Los seis blobs sin cambios: `21c4d3f56318` · `8cfc3736cba2` · `eb61426083ca` · `0d1bb8ea66a8` · `3ce6383eec0d` · `1e21371c8543` |

## Riesgos y dudas nuevas

1. **Dos cartas quedan justo en el límite.** El 7 de copas pasa sin encoger con 18,2 px (0,2 px de margen) y el 5 de copas se queda en exactamente 18,0 px. Con una actualización de Edge que cambie el antialias en una décima, el 7 de copas podría pasar a 0,99 y el 5 de copas a 0,92. No es un fallo, pero la Fase 1b lo verá como un cambio de estado. Además, si Victor quiere el 7 de copas encogido como en la lámina, eso hoy no sale de la regla. **Pregunta:** ¿se deja así o se fija un factor para esa carta?
2. **El criterio de restos no tiene umbral de intensidad.** Un píxel a un solo nivel de la crema pero en la dirección del rojo cuenta como resto. En estas 40 no aparece ninguno. Pero una corrida con remuestreo distinto (en la Fase 1b los WebP salen de otro encogido) podría dar falsos positivos pálidos. Se vigila en la 1b.

---

**Confirmaciones:**

- **Sin commits.**
- **Protegidos intactos.**
- **Ni una escritura en `src/`**, en los maestros ni en los derivados.
- **Sin dependencias nuevas.**
- **Lo tocado en esta tanda:** `scripts/idx/idxCore.mjs`, `scripts/idx/idxPagina.mjs`, `scripts/gen-idx.mjs`, `scripts/testIdxCore.test.js`, la salida regenerada de `capturas-idx/` (ignorada) y este informe.

**STOP.** Victor revisa `capturas-idx/hoja.html` en el teléfono antes de la Fase 1b.
