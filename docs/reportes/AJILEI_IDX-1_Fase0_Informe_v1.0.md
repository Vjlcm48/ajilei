# AJILEI · CAR-1 (índice digital) · Fase 0 · Informe v1.0

Campaña renombrada IDX-1 el 2026-09-25 (CAR-1 ya existía)

**Ficha:** `AJILEI_CAR-1_Fase0_v1.0.md` (2026-09-21) · **Fecha del informe:** 2026-09-24 · **Base:** `5311a32` (main)
**Ejecución:** Claude Code · solo lectura · sin commits

---

## Resumen

1. **El identificador CAR-1 ya está usado.** Es la campaña de la baraja en WebP, cerrada y desplegada el 2026-09-04 (`6b0c022`, `8ea1e83`, `6f59a61`), con ficha, informes y comentarios de código que la citan. Ver §H. El nombre de este informe (`AJILEI_CAR-1_…`) se distingue del de aquella (`AJILEI_CAR1_…`) por un solo guion.
2. **El destino tal como está escrito no cabe en las cartas de dos dígitos.** En Roboto (la fuente medida, §C), un número con los dígitos al 16 % del alto mide entre el 26,5 % y el 31,7 % del ancho de la carta en el 10, el 11 y el 12. La zona del índice mide el 20 %. El número de un dígito sí cabe (14–16,4 %). Ver §B.6 y la pregunta K-1.
3. **El dibujo entra en la zona nueva en 22 de las 40 cartas**, y en otras 7 queda a menos del 2 % del alto. Solo 11 tienen holgura. Invaden casi todas las cartas de pintas del 3 al 7, además del 1 de copas y el 1 de oros, y del caballo de copas y el de espadas. Las figuras 10 y 12 quedan libres o casi. Ver §B.6.
4. **Borrar el índice inferior es seguro en las 40.** El dibujo no toca ninguna de las cajas. El número se pintó sobre una muesca de crema plana (#F5EDD8 exacto, desviación ≤ 5/255), así que tapar con ese color no deja marca visible. Ver §B.7.
5. **Ninguna carta boca arriba queda tapada en la esquina superior derecha** en las 50 mediciones de pantalla (5 viewports × mesa 5 y mesa 2, en juego y en showdown). Los solapes que existen solo afectan a dorsos. Ver §F.
6. **Sharp no está en el proyecto**, y los dos generadores anteriores se escribieron sin Sharp por ese motivo (Edge + canvas). La ficha pide Sharp. Ver §A.4 y la pregunta K-3.
7. **Sin service worker.** Las caras llevan hash de Vite y `index.html` revalida, así que sustituir las imágenes cambia sus URL por construcción: ningún usuario, ni con la PWA instalada, sigue viendo cartas viejas después de recargar. Lo que sí queda viejo son las **capturas** que enseñan la baraja: `mesav.webp`, `mesapc.webp` y `og-image.jpg`. Ver §E.

---

## A · Inventario de archivos

### A.1 Rutas y nombres

| Qué | Ruta | Convención |
|---|---|---|
| 40 caras maestras | `src/assets/cards/{numero}_{palo}.png` | `numero` ∈ uno, dos, tres, cuatro, cinco, seis, siete, diez, once, doce · `palo` ∈ oro, copa, espada, basto (**en singular**). Ej.: `seis_espada.png` |
| 40 derivados servidos | `src/assets/cards/webp/{numero}_{palo}.webp` | Mismo nombre |
| Reverso | `src/assets/cards/reverso_carta.svg` | ID de activo de contrato (Identidad A v1.1 §6). No lo toca esta campaña |
| 5 copias de la Portada | `src/assets/portada/{uno,tres,cinco,diez,doce}_copa.webp` | Mano AJILEI de 51 de la Portada |

### A.2 Formatos, dimensiones y peso

| Conjunto | Formato | Dimensiones | Peso total |
|---|---|---|---|
| 40 maestros | PNG RGB de 8 bits, **sin canal alfa** | **1055×1491** las 40 (proporción 0,7076) | 25 463 075 B (24,28 MB) |
| 40 derivados | WebP q80 | 320×452 | 588 720 B (0,56 MB) |
| 5 de la Portada | WebP | 200×283 | 55 690 B |
| Reverso | SVG | 910×1420 (proporción 0,641) | 6 994 B |

### A.3 Copias y fuente de verdad

- **La fuente de verdad son los 40 PNG** de `src/assets/cards/`. Lo selló Victor en CAR-1 (la de WebP): los maestros se quedan en el repositorio, cada derivado se genera desde el PNG y nunca desde otro derivado. Lo repite el Sistema de Diseño v1.2 §12.4: «no existe maestro vectorial de la baraja».
- Los derivados en el repositorio son `webp/` (40 cartas) y `portada/` (5 de copas). `dist/` es una build vieja y regenerable.
- Las caras también aparecen **dentro de capturas de pantalla**: `src/assets/portada/mesav.webp` y `mesapc.webp` (escena 3 de la Portada, que salen de `PUE_mesav_demo.jpg`, `PUE_mesah_demo.jpg` y `PUE_mesapc_demo.png` en la raíz, sin rastrear), y `public/og-image.jpg` (tarjeta social). Las tres enseñan la baraja actual con el índice invertido.
- En `laminas/` no hay copias de cartas. Los `*_oro*` de `laminas/mon1` y `mon2` son la calibración del oro de la Heptacoin.

### A.4 Scripts que generan o convierten cartas

| Script | Qué hace | Motor |
|---|---|---|
| `scripts/gen-cards.mjs` | Los 40 PNG → WebP q80 a 320 px en `webp/`. Idempotente al byte (CAR-1). Tiene techo de alarma de 0,80 MB y verifica lo que escribe | **playwright-core + Edge (canvas)** |
| `scripts/gen-portada-assets.mjs` | Los 5 de copas → WebP a 200 px (techo de 25 KB por bisección de calidad), más `mesav`, `mesapc` y `og-image` desde las capturas de la raíz | playwright-core + Edge |
| `scripts/process_rey_cards.py` | Vestigio de antes del volcado: procesaba `rey_*.jpg` que ya no existen. Ninguna ruta del código lo usa | Pillow |

**Sharp:** no está en `dependencies`, ni en `devDependencies`, ni en `node_modules`. Las cabeceras de `gen-cards.mjs:10-16` y `gen-portada-assets.mjs:12-21` explican que no se usó por eso y porque el mandato de entonces prohibía dependencias nuevas. La ficha nueva pide Sharp: es una contradicción que resuelve el rector (K-3).

### A.5 Origen del arte: sin capas en el repositorio, sí en Canva

- En el repositorio **no hay originales con capas ni arte sin números**. Los pliegos vectoriales que había (`baraja.svg`, `baraja2.svg`) eran de otra baraja y VEC-1 los retiró (§H.2).
- **Hallazgo nuevo:** el XMP de los 40 PNG dice `Canva (Renderer) doc=DAH… user=UAGBhUGLF7o brand=BAGBhZhjvsQ`, con el título `«<carta> - 1»` y fecha de creación 2026-06-19. **Cada carta es un diseño de Canva distinto**: hay 40 identificadores de documento diferentes, todos del mismo usuario y la misma marca. Así que los números son **texto editable de Canva**, y existe un origen con capas fuera del repositorio, en la cuenta de Victor. Esto abre una alternativa al borrado por píxel (K-2).
- **Cómo está compuesto el arte** (medido): el dibujo de cada carta es un **parche rectangular raster** con un fondo crema *ruidoso* (desviación de 1 a 18 sobre 255 respecto a #F5EDD8), pegado sobre un fondo crema **plano**. Los números están sobre una **muesca** de crema plana recortada en ese parche. En `cuatro_oro` queda además una **placa de borrado** más clara encima del «4» (x 878–919, y 101–136, media #F6EFDD, desviación ≤ 5): es un retoque anterior, apenas visible a tamaño real.

## B · Geometría del índice actual (las 40)

**Sistema de coordenadas:** px del maestro de 1055×1491, con origen arriba a la izquierda. Cifras medidas con scripts efímeros en Python/Pillow desde la carpeta temporal.

### B.1–B.3 Número: caja, alto y color

- **Idéntico en los 40 casos para cada rango:** misma caja y mismo glifo en los cuatro palos. Es texto tipográfico, no dibujado a mano.
- **El índice inferior es la rotación exacta de 180° del superior** alrededor del centro de la carta: `x' = 1054 − x`, `y' = 1490 − y`. Por eso el 6 invertido se lee como 9, que es la queja que motiva la campaña.
- **Alto del número:** de 104 a 107 px, es decir **del 6,98 % al 7,18 % del alto de la carta**. Todos los dígitos tienen la misma altura de cifra; la variación es de antialias.
- **Posición del índice superior:** arriba entre y = 137 y 139; borde derecho entre x = 913 (el «11») y x = 942 (el «4»). Queda a 66 px (4,4 % del alto) del filo interior del marco por arriba y a 58–87 px por la derecha.
- **Color:** **#CF142B** en las 40 cartas y en los dos índices. Es el píxel dominante en ≥ 96 % del núcleo del glifo. **Coincide exactamente con el token `--flag-red`** de `theme.css:88`.

La tabla completa de las 40 cartas está en §B.6.

### B.4 Fondo crema

- **Fuera del parche del dibujo es exactamente #F5EDD8.** Se muestrearon 15 parches de 20×20 por carta (8 en el margen exterior y 7 dentro del marco) en las 40 cartas: desviación máxima **0** en 599 de los 600 parches y **5/255** en el restante (`doce_espada`, que cae dentro del parche del dibujo). **Coincide exactamente con `--text-primary`** (`theme.css:78`).
- **Dentro del parche no es uniforme.** En las cartas con parche grande, solo entre el 35 % y el 50 % del fondo es exacto (por ejemplo `siete_basto` 36 %, `doce_espada` 35 %, `siete_oro` 37 %). El resto se desvía entre 1 y 18. A la vista no se nota, pero **una placa de crema plana que pisara el parche dejaría un borde rectangular** (§J-3).
- La caja `.playing-card` pinta un fondo **#fdf6e3** (`playingCard.css:4`), que no es el crema de la carta. Asoma en las franjas del *letterbox* (§F). Ya ocurre hoy y no depende del índice.

### B.5 Marco

- Color **#1A4A2E** puro, idéntico en las 40 cartas (100 % de los píxeles de la banda). Coincide con el `--green-deep` **del Sistema de Diseño v1.2**. `theme.css` ya lo movió a #153922 (VIS-1b), así que hoy es un verde que no tiene token.
- **Grosor:** 20 px en los laterales (x 34–53 y 1001–1020) y 19 px arriba y abajo (y 52–70 y 1420–1438).
- **Márgenes exteriores** (crema fuera del marco): 34 px a cada lado (3,2 % del ancho) y 52 px arriba y abajo (3,5 % del alto).
- **Interior útil:** x 54–1000 × y 71–1419, es decir 947×1349 px (89,8 % × 90,5 %).
- **Esquinas:** la exterior es redondeada (radio ≈ 15 px); **la interior es recta**, comprobado píxel a píxel.

### B.6 Holgura del arte en la zona del índice nuevo

**Zona medida:** anclada a la esquina interior superior derecha del marco, **x 790–1000 × y 71–487** (211×417 px, el 20 % del ancho por el 28 % del alto). Se cuenta como «dibujo» todo píxel que se desvía más de 18/255 de #F5EDD8, dentro del marco a 3 px del filo, sin los dos números viejos (que se borran) y sin el ruido del parche. El umbral del 2 % del alto son 29,8 px.

**Resultado: 22 cartas INVADEN la zona, 7 quedan a menos del 2 % y 11 están libres.**

- **Invaden (22):** los cuatro 4 y los cuatro 6; los 5 de oros, copas y bastos; los 7 de oros, copas y espadas, y `siete_basto`; los 3 de copas, espadas y bastos; `uno_oro`, `uno_copa`, `once_copa` y `once_espada`. Recuento: 4 + 4 + 3 + 4 + 3 + 2 + 2 = 22. En las cartas de pintas el palo entra desde el borde izquierdo de la zona, casi siempre a partir de y ≈ 200–260, es decir **justo debajo del número actual**, donde irá el pictograma. En `once_copa` entra la cabeza del caballo desde y = 351.
- **Menos del 2 % (7):** `dos_basto` (5,0 px), `diez_espada` (8,1), `cinco_espada` (10,0), `diez_copa` (16,1), `doce_copa` (21,2), `diez_oro` (22,4), `doce_oro` (26,0).
- **Libres (11):** `uno_basto`, `uno_espada`, `dos_oro`, `dos_copa`, `dos_espada`, `tres_oro`, `once_oro`, `once_basto`, `doce_espada`, `doce_basto` y `diez_basto`.

**El número no cabe a lo ancho.** Con Roboto Regular, escalar los glifos actuales (alto 105 px) a un alto de cifra del **16 %** (238,6 px, ×2,27) da:

| Número | Ancho hoy | Ancho al 16 % | Porcentaje del ancho de la carta |
|---|---|---|---|
| 1 | 40 px | 91 px | 8,6 % |
| 2 a 7 | 65–76 px | 148–173 px | 14,0–16,4 % |
| **11** | 123 px | 279 px | **26,5 %** |
| **10** | 145 px | 329 px | **31,2 %** |
| **12** | 147 px | 334 px | **31,7 %** |

Con el interletrado a cero, el «10» sigue midiendo ≈ 24,8 %. Y si el 16 % se refiere al cuerpo de la fuente y no al alto de la cifra (0,711 em en Roboto), la cifra mide 170 px y el «12» pasa a 238 px, **el 22,5 % del ancho**: tampoco cabe. A lo alto, el apilado número 16 % + separación + pictograma 9 % + el margen superior actual (4,4 %) suma **≈ 31 % del alto**, por encima del 28 % de la zona. Solo cabe si el margen superior baja a ≈ 2 %.

**Alto libre bajo la esquina** (última columna de la tabla): cuánto se puede bajar desde el filo interior en la columna del 20 % del ancho antes de tocar dibujo. Un 90,4 % significa que no hay dibujo en toda la columna.

### B.7 Zona del índice inferior que se borra

Caja del número inferior ampliada 6 px por lado: **ninguna carta tiene dibujo dentro (0 píxeles en las 40)**. Los más cercanos: `cuatro_oro` a **2,8 px** (una moneda), `once_copa` a 7,6, `cinco_oro` a 11,7, `diez_espada` a 16,5 y `siete_copa` a 19,0. En esas cinco, el borrado tiene que ceñirse a la caja; no vale un rectángulo generoso.

- **El fondo a borrar es crema plana:** 100 % de píxeles exactos, salvo `cuatro_oro` (83 %, desviación ≤ 5) y `doce_espada` (85 %, ≤ 4). Borrar con #F5EDD8 no deja una placa visible.
- **La fila de estrellas no se ve afectada:** ocupa x 364–690 × y 1319–1385 en las 40 (8 estrellas, #879B83, idénticas) y queda a más de 100 px del número inferior más ancho (x ≤ 263).
- El índice superior viejo también se borra. Ninguna carta tiene dibujo dentro de la caja, pero en `cuatro_oro` el canto de una moneda queda a **6 px** del «4» (x = 861, y 243–246, frente a una caja que empieza en x = 867). Le siguen `cuatro_espada` (7,8 px) y `cinco_oro` (8,5 px). El mismo cuidado de ceñirse a la caja vale aquí.

#### Tabla de las 40 cartas

| Carta | Índice sup. (x0,y0–x1,y1) | Alto | Índice inf. (x0,y0–x1,y1) | Dist. mín. dibujo→zona nueva | px dentro | Veredicto | Alto libre bajo esquina (col. 20 %W) | Dist. mín. dibujo→índice inf. |
|---|---|---|---|---|---|---|---|---|
| `uno_oro` | 876,138–915,242 | 105 px · 7,04 % | 139,1248–178,1352 | 0,0 px · 0,00 % | 9847 | **INVADE** | 12,3 % | 79,1 px |
| `uno_copa` | 876,138–915,242 | 105 px · 7,04 % | 139,1248–178,1352 | 0,0 px · 0,00 % | 4429 | **INVADE** | 8,4 % | 57,0 px |
| `uno_espada` | 876,138–915,242 | 105 px · 7,04 % | 139,1248–178,1352 | 103,3 px · 6,93 % | 0 | **libre** | 46,6 % | 179,0 px |
| `uno_basto` | 876,138–915,242 | 105 px · 7,04 % | 139,1248–178,1352 | 194,8 px · 13,07 % | 0 | **libre** | 47,4 % | 179,0 px |
| `dos_oro` | 870,137–939,242 | 106 px · 7,11 % | 115,1248–184,1353 | 59,0 px · 3,96 % | 0 | **libre** | 90,4 % | 138,3 px |
| `dos_copa` | 870,137–939,242 | 106 px · 7,11 % | 115,1248–184,1353 | 120,0 px · 8,05 % | 0 | **libre** | 90,4 % | 173,0 px |
| `dos_espada` | 870,137–939,242 | 106 px · 7,11 % | 115,1248–184,1353 | 76,0 px · 5,10 % | 0 | **libre** | 59,2 % | 136,2 px |
| `dos_basto` | 870,137–939,242 | 106 px · 7,11 % | 115,1248–184,1353 | 5,0 px · 0,34 % | 0 | **<2 %** | 43,1 % | 82,5 px |
| `tres_oro` | 870,137–935,243 | 107 px · 7,18 % | 119,1247–184,1353 | 53,5 px · 3,59 % | 0 | **libre** | 32,5 % | 94,8 px |
| `tres_copa` | 870,137–935,243 | 107 px · 7,18 % | 119,1247–184,1353 | 0,0 px · 0,00 % | 961 | **INVADE** | 26,8 % | 84,0 px |
| `tres_espada` | 870,137–935,243 | 107 px · 7,18 % | 119,1247–184,1353 | 0,0 px · 0,00 % | 5190 | **INVADE** | 16,2 % | 109,9 px |
| `tres_basto` | 870,137–935,243 | 107 px · 7,18 % | 119,1247–184,1353 | 0,0 px · 0,00 % | 2125 | **INVADE** | 10,5 % | 66,6 px |
| `cuatro_oro` | 867,139–942,242 | 104 px · 6,98 % | 112,1248–187,1351 | 0,0 px · 0,00 % | 18215 | **INVADE** | 7,4 % | 2,8 px |
| `cuatro_copa` | 867,139–942,242 | 104 px · 6,98 % | 112,1248–187,1351 | 0,0 px · 0,00 % | 8434 | **INVADE** | 10,5 % | 49,4 px |
| `cuatro_espada` | 867,139–942,242 | 104 px · 6,98 % | 112,1248–187,1351 | 0,0 px · 0,00 % | 7475 | **INVADE** | 11,8 % | 21,9 px |
| `cuatro_basto` | 867,139–942,242 | 104 px · 6,98 % | 112,1248–187,1351 | 0,0 px · 0,00 % | 7858 | **INVADE** | 8,7 % | 39,3 px |
| `cinco_oro` | 875,139–939,243 | 105 px · 7,04 % | 115,1247–179,1351 | 0,0 px · 0,00 % | 21719 | **INVADE** | 9,2 % | 11,7 px |
| `cinco_copa` | 875,139–939,243 | 105 px · 7,04 % | 115,1247–179,1351 | 0,0 px · 0,00 % | 7618 | **INVADE** | 8,7 % | 72,0 px |
| `cinco_espada` | 875,139–939,243 | 105 px · 7,04 % | 115,1247–179,1351 | 10,0 px · 0,67 % | 0 | **<2 %** | 90,4 % | 126,6 px |
| `cinco_basto` | 875,139–939,243 | 105 px · 7,04 % | 115,1247–179,1351 | 0,0 px · 0,00 % | 10136 | **INVADE** | 9,4 % | 37,9 px |
| `seis_oro` | 873,139–938,243 | 105 px · 7,04 % | 116,1247–181,1351 | 0,0 px · 0,00 % | 10011 | **INVADE** | 12,7 % | 54,4 px |
| `seis_copa` | 873,139–938,243 | 105 px · 7,04 % | 116,1247–181,1351 | 0,0 px · 0,00 % | 2123 | **INVADE** | 8,5 % | 85,0 px |
| `seis_espada` | 873,139–938,243 | 105 px · 7,04 % | 116,1247–181,1351 | 0,0 px · 0,00 % | 1452 | **INVADE** | 13,5 % | 90,5 px |
| `seis_basto` | 873,139–938,243 | 105 px · 7,04 % | 116,1247–181,1351 | 0,0 px · 0,00 % | 9832 | **INVADE** | 9,0 % | 76,2 px |
| `siete_oro` | 869,139–938,242 | 104 px · 6,98 % | 116,1248–185,1351 | 0,0 px · 0,00 % | 4131 | **INVADE** | 10,6 % | 57,8 px |
| `siete_copa` | 869,139–938,242 | 104 px · 6,98 % | 116,1248–185,1351 | 0,0 px · 0,00 % | 6400 | **INVADE** | 11,8 % | 19,0 px |
| `siete_espada` | 869,139–938,242 | 104 px · 6,98 % | 116,1248–185,1351 | 0,0 px · 0,00 % | 592 | **INVADE** | 11,8 % | 101,5 px |
| `siete_basto` | 869,139–938,242 | 104 px · 6,98 % | 116,1248–185,1351 | 0,0 px · 0,00 % | 8704 | **INVADE** | 9,2 % | 25,3 px |
| `diez_oro` | 791,137–935,243 | 107 px · 7,18 % | 119,1247–263,1353 | 22,4 px · 1,50 % | 0 | **<2 %** | 30,7 % | 94,0 px |
| `diez_copa` | 791,137–935,243 | 107 px · 7,18 % | 119,1247–263,1353 | 16,1 px · 1,08 % | 0 | **<2 %** | 31,9 % | 88,0 px |
| `diez_espada` | 791,137–935,243 | 107 px · 7,18 % | 119,1247–263,1353 | 8,1 px · 0,54 % | 0 | **<2 %** | 29,2 % | 16,5 px |
| `diez_basto` | 791,137–935,243 | 107 px · 7,18 % | 119,1247–263,1353 | 42,2 px · 2,83 % | 0 | **libre** | 37,6 % | 28,4 px |
| `once_oro` | 791,138–913,242 | 105 px · 7,04 % | 141,1248–263,1352 | 35,4 px · 2,37 % | 0 | **libre** | 37,9 % | 94,0 px |
| `once_copa` | 791,138–913,242 | 105 px · 7,04 % | 141,1248–263,1352 | 0,0 px · 0,00 % | 15438 | **INVADE** | 18,8 % | 7,6 px |
| `once_espada` | 791,138–913,242 | 105 px · 7,04 % | 141,1248–263,1352 | 0,0 px · 0,00 % | 1135 | **INVADE** | 25,6 % | 36,4 px |
| `once_basto` | 791,138–913,242 | 105 px · 7,04 % | 141,1248–263,1352 | 35,0 px · 2,35 % | 0 | **libre** | 39,4 % | 28,0 px |
| `doce_oro` | 791,137–937,242 | 106 px · 7,11 % | 117,1248–263,1353 | 26,0 px · 1,74 % | 0 | **<2 %** | 43,7 % | 35,0 px |
| `doce_copa` | 791,137–937,242 | 106 px · 7,11 % | 117,1248–263,1353 | 21,2 px · 1,42 % | 0 | **<2 %** | 35,7 % | 53,0 px |
| `doce_espada` | 791,137–937,242 | 106 px · 7,11 % | 117,1248–263,1353 | 34,4 px · 2,31 % | 0 | **libre** | 44,0 % | 44,0 px |
| `doce_basto` | 791,137–937,242 | 106 px · 7,11 % | 117,1248–263,1353 | 57,2 px · 3,84 % | 0 | **libre** | 90,4 % | 33,4 px |

*Veredicto: **INVADE** = hay dibujo dentro de la zona; **<2 %** = el dibujo está fuera pero a menos de 29,8 px; **libre** = a 29,8 px o más. `uno_espada`: se descontó un píxel suelto de antialias en (860,128), con 1 solo píxel distinto en su vecindad de 21×21; sin él, el dibujo más cercano está a 103,3 px. La columna de alto libre de esa fila también está medida sin él.*

## C · Tipografía

1. **Es Roboto Regular (400).** No hay ningún archivo de fuente en el repositorio (0 `.ttf`, `.otf` ni `.woff*` rastreados) ni en los generadores o láminas. La conclusión sale de comparar glifos:
   - Se renderizaron los dígitos 0–7 en Edge con 20 candidatas (14 de Google Fonts y 6 de sistema) y se midió la intersección sobre unión (IoU) contra los glifos de las cartas de espadas, que no tienen arte alrededor. Cada glifo se normalizó a la caja del original.
   - **Roboto 400: IoU media 0,965, mínima 0,948, desviación de proporción 0,6 %.** Heebo 400 da 0,967 porque su latín copia los dígitos de Roboto. Las siguientes quedan muy lejos: Inter 0,846, Noto Sans 0,823, Roboto 500 0,816, Arial 0,783. El peso 500 queda descartado.
   - Encaja con el origen: Roboto está en el catálogo de Canva.
2. Relación de tamaño: en Roboto, la altura de cifra es ≈ 0,711 em. El número actual (105 px de cifra) corresponde a un cuerpo de ≈ 148 px, el 9,9 % del alto de la carta.
3. Para la Fase 1a hará falta **llevar el TTF de Roboto al repositorio** (licencia libre de Google Fonts) o cargarlo desde la red en cada generación. Lo segundo rompe la reproducibilidad (§J-8).

## D · Consumidores

### D.1 Quién pinta caras

| Consumidor | Qué carga | Cómo |
|---|---|---|
| `CardImage.jsx` (dentro de `PlayingCard.jsx`) | Las 40 de `webp/` | `import.meta.glob('../assets/cards/webp/*.webp', { eager, query: '?url' })` |
| `GameTable.jsx` | Todo por `PlayingCard` (líneas 1582–1640): mano, rivales, reveladas, volteo `card-flip-anim` | Pasa por `CardImage` |
| `lib/precargaBaraja.js` | Las 40 (`URLS_BARAJA`, exportado por `CardImage`) | `new Image()` retenido, disparado desde `App.jsx:332` |
| `WelcomeScreen.jsx:7-8` | `webp/doce_oro.webp` y `webp/once_oro.webp` (`.deco-card`, 150 px, opacidad 0,22, rotadas, ocultas por debajo de 680 px) | Import directo `?url` |
| `screens/Portada.jsx:11-17` | `portada/{uno,tres,cinco,diez,doce}_copa.webp` (mano de 51), más `mesav` y `mesapc` (capturas) | Import directo |
| `public/og-image.jpg` | Captura de mesa con la baraja | Ruta fija sin hash |
| Sin caras | `SalaEspera.jsx` (tres reversos), `ShuffleDeck`, mazo y cartas voladoras (reverso en CSS, `gameTable.css` 642, 664 y 1080) | — |
| Tutorial o partida guiada | **No existe** en `src/` (0 coincidencias) | — |
| Arnés | `diagDSK.mjs` lee cartas por el **`alt`** («Sota de Bastos», `msgLeeCartasDom`, 9289+). No mira píxeles ni rutas de imagen | No se ve afectado si el `alt` se conserva |
| Código muerto relacionado | `SuitSymbol.jsx` (pictogramas de palo policromos «estilo Fournier»; 0 importadores; viene del volcado `819e276`) y las clases `.suit-*`, `.card-corner`, `.card-name` y `.card-figure-*` de `playingCard.css` (0 usos en JSX) | Precedente, no consumidor |

### D.2 Vías de dibujo

Comprobado en la medición de §F (contenedor real del `<img>`):

- **Mano del humano:** `.player-zone`, en todos los viewports.
- **Mesa 5/4/3:** `.opp-panel`, en todos los viewports.
- **Mesa 2:** `.ai-zone` en 360×640, 390×844, S25 vertical y 1920×1080; **`.opp-panel` en S25 horizontal** (915×412). Coincide con la nota del Sistema de Diseño v1.2 §12.1.
- **Reveladas del ganador:** son las mismas vías con la clase `opp-winner` o `card-slot-winner`.

Todas pasan por `CardImage`, que es **el único punto que construye la ruta** de una cara de la mesa.

### D.3 Construcción de la ruta

`CardImage.jsx:18-31`: `NUM_MAP[card.value]` (1→uno … 12→doce) + `PALO_MAP[card.palo]` (Oros→oro …) → `../assets/cards/webp/${nombre}_${palo}.webp` → búsqueda en el glob. El `alt` es `${card.name} de ${card.palo}`. Si los archivos nuevos conservan el nombre, `CardImage` no se toca.

### D.4 ¿Algo recorta la carta, pone texto encima o depende del índice?

- **No recorta:** `object-fit: contain` (`CardImage.jsx:37`). Las cajas son más altas que el arte (0,64–0,66 contra 0,708) y el arte **se centra con franjas arriba y abajo**. Por ejemplo, en 360×640 la caja de la mano mide 58×89,83 y el arte 56×79,1, así que hay ≈ 4,4 px de franja arriba. El índice queda dentro del arte en todos los casos. `overflow: hidden` y el radio de 8 px de `.playing-card` solo recortan esquinas de la caja, no del arte.
- **Nada superpone texto** sobre una cara. `.card-selected` y `.card-winner` cambian el borde, el halo y el `translateY`. La cifra de puntos de la mano ganadora («27», «21») va en la cabecera del panel, fuera de las cartas.
- **Solapes (dependencia potencial del índice):** existen tres. Los tres son de `gameTable.css`, **protegido**.
  - `.card-slot-wrapper + .card-slot-wrapper { margin-left: -16px }` (1741, en vertical por debajo de 767 px). Lo anulan `.player-zone` (1779) y `.ai-zone` (1752).
  - `.opp-card-slot:not(:first-child) { margin-left: calc(var(--opp-card-w) * -0.5) }` (1532, en mesas wide y three). La ganadora lo anula (1552 y 5055–5057).
  - Las cartas ganadoras del `.card-slot-winner` (957–963).

  Medido en §F: **ninguna cara queda tapada**. Los solapes vivos solo afectan a dorsos. Queda sin medir el caso de **caras perdedoras reveladas con el toque en el nombre** (§F, nota 3).

### D.5 Importación

Todas las caras entran por **import de Vite con hash de contenido** (glob o import directo) y se emiten como `/assets/<nombre>-<hash>.webp`. Ninguna está en `public/`. La excepción es `og-image.jpg`, que sí está en `public/` y no lleva hash.

## E · Caché y precarga

1. **Precarga:** `precargarBaraja()` (`lib/precargaBaraja.js`), llamada desde `App.jsx:332` en el mismo efecto que `precargarSonidos` al salir de la Bienvenida. Crea 40 `Image` retenidos en un array de módulo, con guarda de reentrada. Carga las URL del glob, así que se entera sola de los archivos nuevos.
2. **PWA:** **no hay service worker ni precaché.** No hay Workbox, ni `vite-plugin-pwa`, ni `registerSW`, ni `navigator.serviceWorker` en ningún sitio. `vite.config.js` solo lleva `react()`. La PWA es un `manifest.webmanifest` (`display: standalone`) y nada más.
3. **¿Seguiría viendo cartas viejas un usuario con la PWA instalada?** **No, después de una recarga.** El mecanismo:
   - Con contenido nuevo y el mismo nombre de archivo, Vite emite **otro hash**, y por tanto otra URL. Está verificado en el `dist/` actual: `uno_copa-BnkvdI2G.webp` y `uno_copa-bogVvQg2.webp` conviven porque son dos contenidos distintos (baraja y Portada).
   - `/assets/*` va con `immutable` por un año (`public/_headers`), pero una URL nueva no tiene nada en caché.
   - `index.html` **no** lleva regla, así que Cloudflare lo sirve con `max-age=0, must-revalidate`. Cada arranque de la PWA revalida el HTML, recibe el JS nuevo y pide las URL nuevas.
   - Las cartas viejas se quedan huérfanas en la caché HTTP y caducan solas.
   - **No hay que hacer nada para forzar la actualización.**
   - **Excepciones:** (a) una pestaña o ventana de la PWA **que siga abierta** conserva el JS viejo, y con él las cartas viejas (y la precarga retenida), hasta que se recargue; (b) `og-image.jpg` no lleva hash: las redes sociales cachean la vista previa por su cuenta, y para renovarla hace falta cambiar el nombre del archivo o pedirles que vuelvan a leer la página.

## F · Tamaños reales en pantalla

**Origen de las cifras: medición, no lectura del CSS.** Ningún modo existente del arnés cubre esta matriz; `gate` solo comprueba media queries y hace capturas. Se midió con un **script efímero fuera del repositorio** que reutiliza `scripts/rutaMesa.mjs → irALaMesa` (la ruta canónica) contra el servidor 5173 de Victor (con bypass), en Edge 153, con reto `basico`, apuesta 0 y entrada «medio». Se juega hasta el showdown y se mide `getBoundingClientRect()` de cada `.playing-card`, más la caja del arte dentro del *contain*. Unidades: px CSS (ancho×alto de la caja; entre paréntesis, el arte).

| Viewport (DPR) | Mesa | Mano del humano | Rival (vía) en juego, dorso | Rival ganador revelado (vía) |
|---|---|---|---|---|
| 360×640 (3) | 5 | 58×89,83 (56×79,1) | 34×51 (`opp-panel`) | 48×73,5 (45×63,6) `opp-panel` |
| | 2 | 58×89,83 (56×79,1) | 55×84 (`ai-zone`) | 53×82 (51×72,1) `ai-zone` |
| 390×844 (3) | 5 | 64×98,55 (62×87,6) | 37,2×56,03 (`opp-panel`) | 52,8×81,05 (49,8×70,4) `opp-panel` |
| | 2 | 64×98,55 (62×87,6) | 65×99 (`ai-zone`) | 63×97 (61×86,2) `ai-zone` |
| S25 vertical 412×915 (2,625) | 5 | 68,39×105,41 (66,4×93,8) | 39,56×59,72 (`opp-panel`) | 56,34×86,58 (53,3×75,4) `opp-panel` |
| | 2 | 68,39×105,41 (66,4×93,8) | 65×99 (`ai-zone`) | 63×97 (61×86,2) `ai-zone` |
| S25 horizontal 915×412 (2,625) | 5 | 99,47×140,59 (97,5×137,8) | 49,22×74,66 (`opp-panel`) | 75,55×116,25 (72,3×102,2) `opp-panel` |
| | 2 | 99,47×140,59 (97,5×137,8) | 103,47×144,59 (**`opp-panel`**) | 106,54×149,72 (104,4×147,6) **`opp-panel`** |
| 1920×1080 (1) | 5 | 115,33×162,98 (113,3×160,2) | 54,05×82,09 (`opp-panel`) | 62,46×96,11 (60,1×84,9) `opp-panel` |
| | 2 | 100,59×142,16 (98,6×139,3) | 95×146 (`ai-zone`) | 93×144 (91×128,6) `ai-zone` |

**Centro de la mesa:** no hay cartas boca arriba. Solo el mazo y las voladoras (reverso). La cifra de 1920 en mesa 5 (115,33×162,98) cuadra con la que DSK-F1 dejó escrita en `gameTable.css` (115,34×163,0).

**Visibilidad de las esquinas.** Para cada cara, 36 puntos de `elementFromPoint` en la zona nueva (20 %×28 %), en el número superior viejo y en el inferior viejo. **El 100 % de las 50 caras medidas deja visibles las tres zonas.**

**Alto del número en pantalla** (alto del arte × porcentaje):

| Sitio | Hoy (7,1 %) | Con el 16 % |
|---|---|---|
| Rival ganador en 360×640, mesa 5 (el más pequeño) | 4,5 px | 10,2 px |
| Mano en 360×640 | 5,6 px | 12,7 px |
| Mano en S25 vertical | 6,7 px | 15,0 px |
| Rival en S25 vertical, mesa 5 | 5,4 px | 12,1 px |
| Mano en S25 horizontal | 9,8 px | 22,0 px |
| Mano en 1920, mesa 5 (el más grande) | 11,4 px | 25,6 px |

**Notas:**
1. Las caras se miden después de sus transformaciones; en el instante medido ninguna tenía `transform`.
2. La mano en juego de mesa 5 salió con 2 caras y 1–2 dorsos porque se midió en mitad del reparto. Las cajas son las mismas que en el showdown.
3. **No se midieron las caras perdedoras reveladas con el toque en el nombre.** El script tocó los nombres pero en las 10 celdas solo quedó revelada la ganadora. Según `gameTable.css:5041` («slot revelado de −0,35 a +0,3») las reveladas se separan, pero está **sin comprobar**.
4. Las capturas se guardaron en la carpeta temporal y no quedaron en el repositorio.

## G · Colores disponibles

**Contraste sobre la crema #F5EDD8** (WCAG; 4,5:1 es el mínimo para texto normal y 3:1 para texto grande):

| Uso posible | Token o origen | Hex | Contraste |
|---|---|---|---|
| **Copas (número actual)** | `--flag-red` (`theme.css:88`) | #CF142B | 4,75:1 |
| Espadas, azul | `--flag-blue` (`theme.css:87`) | #003893 | 9,05:1 |
| Espadas (legado muerto) | `.suit-espadas` (`playingCard.css`) | #0A1A3A | 14,72:1 |
| Bastos, verde | `--green-deep` de la v1.2 = **el marco** | #1A4A2E | 8,72:1 |
| Bastos, verde | `--green-deep` de hoy (`theme.css:49`) | #153922 | 10,97:1 |
| Bastos, verde | `--green-bright` | #235C38 | 6,76:1 |
| Bastos (legado muerto) | `.suit-bastos` (es marrón) | #3D2010 | 12,73:1 |
| Verde claro | `--win-green` | #66BB6A | 2,03:1 (insuficiente) |
| Oro de marca (**vetado para oros** por la ficha) | `--gold-brand` | #E8B84B | 1,58:1 |
| Oro, variante | `--gold-dim` (uso restringido) | #C9973A | 2,26:1 |
| Oro, variante | `--gold-brand-deep` (EMB-1: «el mismo oro, no otro») | #AC7E16 | 3,13:1 |
| **Ocre oscuro (legado muerto)** | `.suit-oros` y `SuitSymbol.jsx` | #7A5200 | 5,93:1 |
| Naranja | `--raise-orange` | #E65100 | — (semántico de apuesta) |
| Estrellas de la carta | Ninguno | #879B83 | 2,55:1 |

- **No existe ningún token ocre o ámbar** distinto del oro. Los únicos candidatos escritos son el legado muerto #7A5200 (el más cercano a «ocre oscuro») y los tres derivados del oro, que **son el mismo oro** por definición: `theme.css:12-21` dice que tienen idéntico tono y saturación, y que solo cambia la luminosidad. Usar uno de ellos en los oros sería usar el oro de marca.
- **Crema de la carta:** #F5EDD8 = `--text-primary` (§B.4).
- **Regla del oro:** Identidad A v1.1 §6: «**Regla del oro único.** Fuera de la Heptacoin solo existe `#e8b84b`, plano o con opacidad». El Sistema de Diseño v1.2 §9.1 da por saldado el «doble dorado». La regla no dice si alcanza al **arte interior de las cartas**, que ya está lleno de dorados propios (monedas, copas, empuñaduras). Un ocre de índice que se lea como dorado sería un segundo oro dentro del producto (K-5).
- **Daltonismo:** con deuteranopía, rojo (copas) y verde (bastos) son el par de peor contraste. El pictograma es lo que lo compensa, siempre que las formas sean inconfundibles.
- La ficha cita `AJILEI_Sistema_Diseño_v1.3`. **En el repositorio solo existe la v1.2** (`docs/AJILEI_Sistema_Diseno_v1.2.md`). Tampoco recoge los verdes de VIS-1b ni los derivados del oro de EMB-1, que `theme.css` anuncia para «su próximo salto de versión».

## H · Precedentes

1. **CAR-1 ya se usó:** es la campaña de la baraja WebP, precarga y `_headers` (fichas `docs/AJILEI_CAR1_Fase0_v1.0.md`, `…_Fase1_v1.0.md` y `…_Cierre_Commits_v1.0.md`; informes `docs/reportes/AJILEI_CAR1_{Fase0_Informe,Fase1_Reporte,Cierre_Reporte}_v1.0.md`; commits `6b0c022`, `8ea1e83`, `6f59a61` y `6abedce`; y comentarios «CAR-1» en `CardImage.jsx`, `gen-cards.mjs`, `precargaBaraja.js` y `_headers`). También la citan los informes de LOB-1, SAL y SAL-B1 y el Sistema de Diseño v1.2 §12. **El rector renombra.** No se encontró ningún CAR-2.
2. **VEC-1 (2026-09-05, `cdc996a`):** retiró `baraja.svg` y `baraja2.svg` del árbol. Eran vectores de **otra** baraja («NAIPES LIBRES», sin caballos). **No toca las caras de las 40**; confirma que no hay maestro vectorial y que los PNG son «la fuente y el techo» (Sistema de Diseño v1.2 §12.4). Esta campaña **cambia los PNG**, y por tanto cambia esa frase: hay que decidir qué pasa a ser el maestro (K-4).
3. **Otros documentos sobre las cartas:**
   - Sistema de Diseño v1.2 §2.3 (cartas decorativas de la Bienvenida) y §12 (vías de render, reverso, VEC-1).
   - Identidad A v1.1 §6 (reverso R-2 «Greca», que hereda las 8 estrellas en arco).
   - `docs/AJILEI_Diseno_Landscape_v1.0.md` y la doctrina DSK sobre tamaños.
   - `AJILEI_Menu_Utilidades_v1.1.md:111`: el popup de mano muestra el valor relativo y «**nunca** el valor nominal impreso en la carta». El índice nuevo sigue siendo el valor nominal, así que no hay conflicto.
   - No existe ningún documento sobre el **diseño del índice** en sí.

## I · Línea base (2026-09-24, sobre `5311a32`)

| Qué | Cifra |
|---|---|
| `npm test` (vitest 4.1.8) | **34 archivos · 963 pruebas · 963 aprobadas** · 1,83 s |
| `npx eslint .` | **21 problemas: 20 errores y 1 aviso**. Es la línea base conocida de 20 errores, sin cambios |
| `node scripts/diagDSK.mjs gate` (5173) | **Matriz 6/6 ok** (640×360, 360×640, 844×390, 1024×768, 1366×768, 1920×937), 4 capturas en `capturas-dsk/` (ignorada). Instrumento: playwright-core 1.62.1, **Chromium 153.0.4234.48, con aviso de deriva** frente a las líneas base 151.0.4129.93 |
| Protegidos | `gameTable.css` blob `1e21371c8543` y `deck.js` `eb61426083ca`: coinciden con la instantánea §3 de Protegidos v1.5 |

---

## J · Riesgos (de más a menos grave)

1. **Los números de dos dígitos no caben en la zona al 16 %.** El 10, el 11 y el 12 necesitan entre el 26,5 % y el 31,7 % del ancho, contra el 20 % de la zona. Es geometría pura, no depende de la carta. Si se fuerza, el índice pisa el dibujo en las 12 figuras o se sale del marco.
2. **El dibujo invade la zona en 22 cartas y roza en 7.** El pictograma (al 9 %, justo debajo del número) cae precisamente en la franja y ≈ 200–490, donde entran las pintas de los 3–7. Sin halo, placa o recolocación, número y pictograma se montan sobre copas, espadas, bastos y monedas del arte. Esto también choca con el punto 5 del destino («el arte no cambia»).
3. **Una placa de crema plana dejaría costura.** El dibujo es un parche raster con fondo crema ruidoso (±18), así que un rectángulo #F5EDD8 que lo pise se vería como una placa. Borrar los números viejos sí es seguro, porque están sobre crema plana.
4. **El mandato de maestros sellado choca con la sustitución.** CAR-1 selló que los 40 PNG originales son los maestros y que todo se deriva de ellos. Si se reemplazan, se pierde el original (no hay otra copia en el árbol, solo en el historial de git). Si se archivan y se añaden maestros nuevos, el repositorio crece ≈ 25 MB más. Además, la frase «los PNG son la fuente y el techo» del Sistema de Diseño §12.4 deja de ser cierta.
5. **La cadena de derivados es más larga de lo que parece.** Hay que regenerar `webp/` (40), `portada/*_copa.webp` (5, desde los PNG) y **volver a capturar** `mesav`, `mesapc` y `og-image`: son capturas de la mesa real, con maestros sin rastrear en la raíz, y enseñan la baraja vieja con el índice invertido. `.deco-card` sale sola.
6. **El borrado tiene poco margen en 5 cartas.** En el índice inferior, `cuatro_oro` está a 2,8 px del dibujo y `once_copa` a 7,6; en el superior, la moneda de `cuatro_oro` queda a 6 px. Un borrado rectangular generoso se come arte.
7. **Sharp contra el precedente.** La ficha pide Sharp; el proyecto no lo tiene y los dos generadores anteriores lo evitaron a propósito. Si se añade, el texto se rasteriza con otro motor que el navegador del jugador; si no, se sigue con canvas de Edge.
8. **Reproducibilidad del generador.** Rasterizar texto hace que el resultado dependa del navegador. Edge ya derivó de 151 a 153 y el arnés lo avisa. La idempotencia al byte que presumía `gen-cards` no está garantizada para un paso con tipografía. Además, Roboto tiene que vivir en el repositorio; cargarla desde la red en cada generación no es reproducible.
9. **Regla del oro.** Un ocre que se lea como dorado al lado de las monedas incumple el espíritu de la regla del oro único. Los tres derivados del oro que existen *son* el oro de marca.
10. **Legibilidad y daltonismo.** Al 16 %, el índice más pequeño de la mesa mide ≈ 10 px (rival ganador en 360×640, mesa 5). Es legible, aunque justo. Rojo y verde se confunden con deuteranopía.
11. **Caras perdedoras reveladas sin medir** (§F, nota 3). Si alguna vía las solapa, la esquina derecha, que ahora es la única, podría quedar tapada. El índice inferior-izquierdo que se elimina es el que hoy sobreviviría a un solape por la derecha.
12. **El nombre del informe casi coincide** con el de la CAR-1 anterior (`AJILEI_CAR-1_Fase0_Informe_v1.0.md` frente a `AJILEI_CAR1_Fase0_Informe_v1.0.md`). Se confundirán en cualquier búsqueda.

## K · Preguntas al rector

1. **¿Cómo cabe el número de dos dígitos?** Opciones: (a) un 16 % solo para 1–7 y una altura menor para 10–12 (≈ 10–12 %); (b) ensanchar la zona en las figuras, aunque el arte no siempre deja sitio: con el 25 % del ancho, el alto libre bajo la esquina va del 21,9 % al 29,4 % en 9 de las 12 figuras, y baja a 18,8 % en `once_copa`, 9,7 % en `doce_oro` y 7,8 % en `once_basto`; con el 30 % del ancho queda entre el 5,6 % y el 23,1 %. El número solo, con su margen, pide ≈ 20 % de alto libre; (c) Roboto Condensed o un interletrado negativo; (d) definir el 16 % como cuerpo y no como altura de cifra (tampoco basta: 22,5 %).
2. **¿Borrado por píxel o edición en Canva?** Los 40 diseños existen en la cuenta de Victor con el número como texto editable. Quitar los números y exportar desde Canva da arte limpio sin retoques, pero obliga a 40 exportaciones manuales y rompe la regla de un generador que lo hace todo. El borrado por píxel es viable (§B.7).
3. **¿Sharp (dependencia nueva, pedida por la ficha) o canvas de Edge (precedente de la casa)?**
4. **¿Qué pasa a ser el maestro?** (a) PNG nuevos en `src/assets/cards/` y la baraja actual archivada en otra ruta (¿cuál? ¿dentro del repositorio, sumando 25 MB, o fuera?); o (b) los maestros no se tocan y el generador aplica el índice en el mismo paso en que deriva el WebP (sin PNG nuevos en el repositorio). La (b) respeta lo sellado en CAR-1.
5. **Ocre de los oros:** ¿alcanza la regla del oro único al índice de la carta? ¿Sirve el legado #7A5200 (5,93:1) como punto de partida, o hay que abrir un token nuevo con el Sistema de Diseño v1.3?
6. **¿Qué verde para los bastos?** El #1A4A2E del marco (el número se fundiría con el marco a tamaño pequeño), el `--green-deep` actual #153922 u otro. **Y el azul de las espadas:** ¿`--flag-blue` #003893?
7. **¿Qué hacer donde el pictograma invade el dibujo** (22 cartas)? ¿Halo o contorno crema alrededor del glifo? ¿Mover el pictograma a la izquierda del número? ¿Aceptar el pisado?
8. **¿Entran en la campaña las tres capturas** (`mesav`, `mesapc`, `og-image`)? Si entran, ¿las rehace Victor en el S25 y en el PC, o se capturan con el arnés?
9. **¿Se mide la revelación de perdedoras** (§F, nota 3) en la Fase 1b, o se da por cubierta con la lectura de `gameTable.css:5041`?
10. **Nombre nuevo de la campaña.** El documento pedía que el rector lo decidiera.

## L · Estimación (minutos de Claude Code)

| Fase | Contenido | Estimación |
|---|---|---|
| **1a** | Generador (borrado ceñido de los dos índices + número Roboto + 4 pictogramas planos + colores), Roboto en el repositorio, hoja de contacto de las 40 y la zona de riesgo de las 22 revisada una a una | **150–210 min** si K-1, K-4 y K-7 llegan resueltos. El diseño de los cuatro pictogramas es la parte más incierta; +60 min si hay que iterar formas |
| **1b** | Regenerar `webp/` (gen-cards) y `portada/` (gen-portada-assets), comprobar el techo de peso, capturas del arnés en los 5 viewports × 2 vías (incluidas las perdedoras reveladas), pruebas y lint. Caché: nada que tocar (§E) | **90–120 min**. +30 min si las capturas de Portada y og-image se hacen con el arnés |

---

**Confirmaciones:**
- **Sin commits.**
- **Archivos protegidos intactos**: solo se leyeron y los blobs coinciden (§I).
- **El árbol de trabajo no tiene residuos nuevos**: `git status` muestra los mismos seis archivos sin rastrear que al empezar, más este informe.
- Todos los scripts de análisis y las capturas de la medición vivieron en la carpeta temporal de la sesión.
- `diagDSK gate` reescribió sus 4 capturas y su JSON en `capturas-dsk/`, que está ignorada por git.

**STOP.**
