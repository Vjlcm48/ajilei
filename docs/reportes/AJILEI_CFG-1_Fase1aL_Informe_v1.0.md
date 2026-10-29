# AJILEI · CFG-1 · Fase 1a-L · Lámina corta de la 1a · Informe · v1.0

- **Ficha:** `AJILEI_CFG-1_Fase1aL_Lamina_v1.0.md` (rector). **Fase 0:** `docs/reportes/AJILEI_CFG-1_Fase0_Informe_v1.0.md`.
- **Fecha:** 2026-10-29. **Ejecutor:** Claude Code. **Base:** `main` en `c0bc2c1`. **Tiempo:** ~90 min.
- **Escrito para:** el rector y Victor.
- **Escrituras:** solo `laminas/cfg1a/` (sin seguimiento de git) y este informe. **Nada de `src/` tocado.** Sin commits.

---

## Resumen

La lámina corre sobre la **app real**: vite en desarrollo con el bypass, navegando por `data-accion`. Lo que la 1a añadiría está en dos sitios:
- una hoja aditiva, `cfg1a.css`, escrita como la escribiría la 1a;
- un guion que mete en el DOM lo nuevo (ojito, «Español», sugerencia, versión y estado del sonido).

Las medidas son las aplicadas: caja más `::after`, comprobadas además con un barrido de `elementFromPoint`. Hay 206 capturas en las seis celdas y `medidas.json`.

| | |
|---|---|
| **V1 · ¿cabe la A en 360?** | **No, con nombre.** La A alarga la píldora 44 px en 360 (92 → 136). El nombre se queda en **2 letras** («De…»), tanto con «DevLocal» (8) como con «MaracuchaBrava_» (15); hoy entran 8 y 9. En 390 y 412 entran 3. La B es peor: 1 letra. La C deja «DevLocal» entero y 5 de 15. Detalle en §4-1. |
| **V2 · la hoja** | Con las filas a 44, la hoja crece **+6,36 px en 360** (de 377,16 a 383,52). **Entra sin desplazarse en 360×640 incluso con «Acerca de» abierto**: 532 de 568 de tope, y termina en el píxel 584 de 640. Solo se desplaza en 915×412 (como hoy) y en 1366×768 con «Acerca de» abierto (como hoy). |
| **V5 · zonas de 44** | Las zonas de 44 se cumplen en las seis celdas para ⚙, casa, flecha, avatar, chips, ±, «Unirme», «Entrar» y el campo. **No hay solapes entre tocables**, salvo **0,95 px** en 360 (⚙/casa y avatar/flecha) con V1-A; con V1-C son **3,7 px**. Para llegar aquí hicieron falta **cuatro arreglos** que la 1a tiene que copiar (§4-3). |
| **Hallazgos** | (1) Hoy el toast del lobby queda **bajo el velo de la hoja** (z 5 < 6). (2) **La Sala de espera tiene el velo de su diálogo dentro del cuerpo**: el arreglo de capas no se le puede aplicar igual. (3) Sobre Retar y Rankings, **la hoja no cuadra con el ⚙ en las pantallas apaisadas bajas**: −6,61 px en 1366×768. |
| **Recomiendo** | **V1 C** (difiere del rector; motivo en §5) · **V2 A** · **V3 A** · **V4 A**. |

---

## §1 · Cómo se sirve y cómo se usa

**Receta:** la de las láminas sobre la app real (TAB-1 1a, IOS-1 1d), no la de la 1e-L. La 1e-L era una página autocontenida; esta ficha pide las hojas reales, y la forma más fiel de tenerlas es la app misma.

```
npx vite --port 5174 --strictPort --host 0.0.0.0      (en la raíz del repo; ya hay uno levantado)
```

- **PC:** <http://localhost:5174/laminas/cfg1a/lamina.html>
- **S25 (misma red):** `http://192.168.12.171:5174/laminas/cfg1a/pantalla.html?vista=lobby&panel=1`. Abre la vista a pantalla real, con un botón morado **«CFG-1a ▾»** abajo al centro. Ese botón despliega un panel para cambiar la vista y las variantes. También se puede llegar desde el visor de la PC con «abrir sola ↗».

| Archivo | Qué es |
|---|---|
| `lamina.html` | El visor. Arriba van los controles: vista, celda (o «las seis»), V1, V2, V3, V4, ojito, nombre (corto, 15 letras o 15 «W»), commit o `local`, **capa de zonas**, **«hoy»** (apaga la lámina entera para comparar) y **«▶ contar»** (la píldora cuenta de 2.400 a 2.650). Cada marco va al tamaño exacto de su celda, escalado si no cabe, y debajo enseña sus medidas en vivo. |
| `pantalla.html` | La app real con `pre.js` (sonido apagado y pantalla completa anulada), `cfg1a.css`, `lamina-capa.css` y `guion.js`. |
| `cfg1a.css` | **La hoja que la 1a copiaría.** Lo único que es de la lámina es el prefijo `html[data-cfg-…]` / `html:not([data-cfg-hoy])` de cada selector. Detalle en su cabecera. |
| `lamina-capa.css` | Solo de la lámina: la capa de zonas, el portal de la V6, el panelito y el modo foto. |
| `guion.js` | Navega, inyecta, ataja los clics nuevos en fase de captura y mide (`window.__cfg1a.medir()`). |
| `capturar.mjs` | Saca 206 fotos y las medidas: `node laminas/cfg1a/capturar.mjs [filtro]`. Los teléfonos van con `isMobile` + `hasTouch` y DPR 2. |

**Cambiar de variante no recarga** (mensaje al marco). **Cambiar de vista sí**, porque hay que navegar la app.

En la capa de zonas:
- **rojo:** la zona táctil real;
- **naranja con su cifra:** menos de 44;
- **rayado magenta:** solape entre dos tocables.

---

## §2 · Capturas

Están en `laminas/cfg1a/capturas/`, 206 PNG (88 MB, porque los teléfonos van a DPR 2). El nombre es `<CASO>_<ancho>x<alto>.png`, en las seis celdas (1920×1080, 1366×768, 412×915, 915×412, 390×844 y 360×640):

| Vista | Casos |
|---|---|
| V1 | `V1A`, `V1B` y `V1C` en cuatro estados: tal cual (ojito abierto), `-cerrado`, `-cuenta` (cerrado, a media cuenta, 2.525) y `-largo-zonas` (15 letras, capa encendida). Además, `-w15-zonas` (15 «W», solo 360 y 390) y las referencias de hoy `V1hoy`, `V1hoy-largo-zonas` y `V1hoy-w15-zonas` |
| V2 | `V2A` y `V2B` (hoja plegada), `V2A-acerca`, y las referencias `V2hoy` y `V2hoy-acerca` |
| V3 | `V3A` (desplegada, con el toast «Copiado») y `V3B` |
| V4 | `V4A`, `V4B` y `V4A-local` |
| V5 | `V5-lobby`, `V5-retar`, `V5-salas` y `V5-hoja` (capa encendida, con V1-A), más `V5-retar-C` y `V5-retar-hoy` |
| V6 | `V6-rankings` (Fortunas, vino), `V6-retar` y `V6-rankings-acerca` |

---

## §3 · Medidas

Formato: **caja visible → zona táctil**, en px, tal como se aplican. La zona es la caja unida a su `::after`, y se confirma con un barrido de `elementFromPoint` desde el centro. El 43,98 de 360/390 es la cuantización de 1/64 px de Chromium y cuenta como 44.

### 3.1 · V1 · la barra del lobby

| Celda | | Barra (alto) | Píldora | «+» | Ojito | Nombre: «DevLocal» · 15 letras · 15 «W» |
|---|---|---|---|---|---|---|
| **360×640** | hoy | 38,5 | 92,05×31,67 | 18,36 → 18,36 | — | 8/8 · 9/15 · 5/15 |
| | **A** | **44** | 136,13×44 | **44 → 44** | 18,36×42 → 44×44 | **2/8 · 2/15 · 1/15** |
| | **B** | 38,5 | 142,45×31,67 | **44 → 44** | 18,36 → 44×44 | **1/8 · 1/15 · 1/15** |
| | **C** | 38,5 | 114,72×31,67 | 18,36 → **44×44** | 18,36 → 44×44 | 8/8 · 5/15 · 3/15 |
| **390×844** | hoy | 41,7 | 99,44×32,39 | 19,88 | — | 8/8 · 9/15 · 5/15 |
| | A | 44 | 143,61×44 | 44 | 19,88×42 → 44 | 3/8 · 3/15 · 2/15 |
| | B | 41,7 | 148,66×32,39 | 44 | 19,88 → 44 | 2/8 · 2/15 · 1/15 |
| | C | 41,7 | 123,98×32,39 | 19,88 → 44 | 19,88 → 44 | 8/8 · 5/15 · 3/15 |
| **412×915** | hoy | 44,06 | 104,91×34,13 | 21 | — | 8/8 · 9/15 |
| | A | 44,06 | 149,14×44 | 44 | 21×42 → 44 | 3/8 · 3/15 |
| | B | 44,06 | 153,22×34,13 | 44 | 21 → 44 | 3/8 · 3/15 |
| | C | 44,06 | 130,84×34,13 | 21 → 44 | 21 → 44 | 8/8 · 5/15 |
| **915×412** | hoy | 44,06 | 104,91×34,13 | 21 | — | 8/8 · 15/15 |
| | A / B / C | 44,06 | 149,14×44 / 153,22×34,13 / 130,84×34,13 | 44 / 44 / 21 → 44 | → 44 en las tres | 8/8 · 15/15 en las tres |
| **1366×768 · 1920×1080** | hoy | 64,19 | 151,47×48,78 | 30,59 | — | 8/8 · 15/15 |
| | A | 64,19 | 201,03×48,77 | 48,77 | 30,59×46,77 → 44×46,77 | 8/8 · 15/15 |
| | B | 64,19 | 209,86×48,78 | **56,39** | 30,59 → 44 | 8/8 · 15/15 |
| | C | 64,19 | 189,25×48,78 | 30,59 → 44 | 30,59 → 44 | 8/8 · 15/15 |

**La cifra no se mueve: abierta = tapada en todas las variantes y celdas.**
- 31,05×23,2 en 360, 35,38×23,2 en 412, 51,13×23,2 en 1366 y 51,13×26,09 en 1920.
- La píldora mide lo mismo abierta y tapada.
- A media cuenta (`-cuenta`) los puntos siguen en su sitio. La cifra solo cambiaría de ancho si la cuenta cruzara un dígito (9.999 → 10.000), igual que hoy.

**Cuánto de la cifra queda bajo una zona** (no tocable, no es problema):

| Variante | En 360 |
|---|---|
| A | La zona del ojito cubre 8,5 de los 31,05 px de la cifra (27 %) y 8,5 de la moneda |
| B | La del ojito, 7,78 |
| **C** | La del ojito, 8,5 + la del «+», 5,63 = **14,1 px (45 % de la cifra)**. La del «+» roza además la ficha de constancia (1,39 px) |

**El ⚙ y la constancia:** la zona del ⚙ **no** llega a la ficha de constancia en ninguna celda ni variante. El roce que anticipó la Fase 0 no se da: en 360 la ficha termina en x = 286,5 y la zona del ⚙ empieza en 309,7.

**Reglas que producen cada medida:**

| Elemento | Regla |
|---|---|
| «+» hoy | `width/height: 1.5em` (`lobby.css:248-287`, `salas.css:265-283`) |
| «+» A | `cfg1a.css §3`: `--pil-h: max(44px, 8.13u)`, con la píldora a `height: var(--pil-h)` y el «+» del mismo lado |
| «+» B | `cfg1a.css §3`: `--mas-b: max(44px, 9.4u)` con márgenes de bloque negativos (no empuja la barra) |
| «+» C | Hoy, más `::after` con `inset: min(0px, calc(50% − 22px))` |
| Ojito | `cfg1a.css §3`: `1.5em` más el mismo `::after`. En A va a todo el alto útil de la píldora (`--pil-h − 2px`) |
| Cifra tapada | `cfg1a.css §4`: `color: transparent` + `::after «••••»` centrado + `pointer-events: none` |

### 3.2 · V2 · la hoja del ⚙

Con V1-A, V3-A y V4-A, que son los valores por defecto. Para cada celda: alto de la hoja, píxel donde termina y tope (`max-height: calc(100dvh − 20u)`, `lobby.css:634`).

| Celda | Hoy, plegada | 1a, plegada | Hoy, «Acerca de» abierto | 1a, «Acerca de» abierto | ¿Se desplaza? (1a) |
|---|---|---|---|---|---|
| 360×640 | 377,16 (hasta 426) | **383,52** (hasta 436) | 505,78 | **532,14 (hasta 584), tope 568** | **no** |
| 390×844 | 392,22 | 393,98 | 531,66 | 554,42 | no |
| 412×915 | 402,94 | 401,48 | 550,23 | 570,52 | no |
| 915×412 | 329,59 = tope | 329,59 = tope | tope | tope | **sí, como hoy.** Cuerpo visible: 210 px de 282 (plegada) o de 451 (abierta) |
| 1366×768 | 501,25 | 495,44 | 648 = tope | 648 = tope | solo con «Acerca de» abierto, **como hoy** (cuerpo visible 492 de 582) |
| 1920×1080 | 519,59 | 513,78 | 734,03 | 756,22 | no |

**Filas en 360:**
- Hoy: 44,73 · 44,73 · 44,73 · **40,45 · 40,45** · 45,73.
- 1a: 44,73 · 44,73 · 44 · **44 · 44** · 45,73.
- Regla: `cfg1a.css §2`, `.lob-fila { min-height: 44px }`. Las dos filas sin pastilla suben 3,55 px cada una. «Enviar sugerencia» con V3-A pierde su pastilla y baja de 44,73 a 44. Neto: **+6,36 px**.
- En escritorio la hoja **baja** unos 5,8 px: allí las filas ya pasaban de 44, y la sugerencia pierde la pastilla.

**V2-A frente a V2-B:** la B, con su interruptor, deja la fila «Sonido» en 44 (en vez de 44,73) y en escritorio en 55,3 (en vez de 60,69). La hoja es 0,7–5,4 px más corta. No cambia nada de lo que cabe.

**Cabecera fija:**
- `cfg1a.css §2` convierte la hoja en columna: título y cuenta fijos, y debajo un `div.cfg-hoja-cuerpo` desplazable. El techo es el de hoy.
- Donde la hoja no se desplaza, se ve exactamente igual que sin el cambio.
- En 915×412 la cabecera ocupa ~120 de los 330 px y la lista queda en 210 (unas 4,5 filas). Ver P-4.

**Anclaje al ⚙:** el hueco entre el ⚙ y la hoja es igual que hoy en las seis celdas (1,8 px en 360, 3 en 1920), con el borde derecho a plomo (0). Con V1-A hace falta para eso la corrección de `top` de `cfg1a.css §3`. Sin ella, la barra de 44 baja el ⚙ 2,75 px y **la hoja taparía 0,94 px del ⚙ en 360** (calculado con las cajas medidas: ⚙ hasta y = 50,25 y hoja desde 49,31).

### 3.3 · V3 · «Enviar sugerencia»

| | 360×640 | 390×844 | 412×915 | 1366 · 1920 |
|---|---|---|---|---|
| **A** · «Escribir correo» / «Copiar correo» | 116,02×44 / 116,02×44 | 125,75×44 | 132,91×44 | 194×44 |
| A · cuánto crece la hoja al desplegar | +72,06 (455,58, hasta 508) | +74,4 | +76,2 | +90,8 |
| **B** · la fila (dos líneas) | **59,73** de alto | 60,86 | 61,66 | 68,64 / 74,42 |
| B · «Copiar» | 47,53×30,92 → zona 47,53×44 | 51,36×31,39 → ×44 | 54,14×31,73 → ×44 | 77,95×34,73 / 37,63 → ×44 |

- **El toast «Copiado»** se ve **por encima** de la hoja en las seis celdas, pero solo gracias a `cfg1a.css §8` (`z-index: 8` mientras la hoja está abierta).
- **Hoy el toast del lobby lleva `z-index: 5`** (`lobby.css:739`), **bajo el velo (6, `:567`) y la hoja (7, `:612`)**: el «Pronto» que hoy disparan Sonido, Idioma, Sugerencia y Eliminar sale velado.
- En **escritorio**, la dirección `soporte@ajilei.io` está a la vista en las dos variantes (A en su línea, B como segunda línea de la fila). Es la red de seguridad si el `mailto:` no abre nada.
- El `mailto:` de la lámina es real: asunto «Sugerencia · AJILEI 0.9.0» y cuerpo con jugador, versión, aparato e idioma. En el S25 abre la app de correo. Lleva `data-sin-pantalla-completa` (INV-45), igual que «Copiar».

### 3.4 · V4 · la versión

- **A:** `AJILEI 0.9.0 · c0bc2c1` es la primera línea al abrir, encima de «by HEPTACREATION».
- **B:** la misma línea va al pie, con su filete. Añade **+6,75 px** (538,89 frente a 532,14 en 360).
- **En 1366×768, con «Acerca de» abierto, la hoja ya llega al tope** y se desplaza. Con la B, la versión queda **fuera de la vista** (cuerpo visible 492 de 592) hasta desplazar. Con la A es lo primero que se ve.
- El respaldo `AJILEI 0.9.0 · local` mide igual que la A.
- El commit va en ancho fijo y tenue. **Ojo:** `index.css:98-111` viste todo `<code>` con 15 px, fondo claro y relleno. La primera captura salió con el commit en una pastilla blanca. `cfg1a.css §7` lo anula.

### 3.5 · V5 · las zonas de 44 (camino Z)

Con V1-A. Resultado en las seis celdas, con los cuatro arreglos de §4-3 puestos:

| Tocable | Caja hoy (360 · 390 · 412 · 915×412) | Zona 1a | Solapa con… | ¿Es tocable? |
|---|---|---|---|---|
| ⚙ (lobby y `.sal`) | 31,31 · 33,92 · 35,84 · 35,84 | 44 en las cuatro (en 1366 y 1920 sigue en 52,19) | casa, **0,95 px** solo en 360 (en C, **3,7**) | **sí** |
| Avatar `.lob-perfil` | alto 38,5 · 41,7 · 44,06 · 44,06 | alto 44 | flecha, **0,95 px** solo en 360 (en C, **3,7**) | **sí** |
| Casa (Retar, Salas) | 31,31 · 33,92 · 35,84 · 35,84 | 44 | ⚙ (arriba) | sí |
| Flecha | ídem | 44 | avatar (arriba); el título **no** se toca | sí / — |
| Chips (4 filas de Retar) | alto 40 | alto 44 | nada (las filas van a más de 4 px) | — |
| ± del contador | 40×40 | 44×44 | el monto | no |
| «Unirme» | 65,61×35,19 | 65,61×44 | nada | — |
| «Entrar» y el campo de código | 44 (ya cumplían) | 44 | — | — |
| «+» y ojito | ver 3.1 | 44 | cifra, moneda (y la constancia en C) | no |

- **Por encima de 360 no hay ningún solape entre tocables.**
- Los dos de 360 son de 0,95 px con V1-A, porque la barra de 44 separa la fila de la flecha. Con V1-C son de 3,7 px, porque la barra sigue en 38,5 y la fila de la flecha queda 8,98 px bajo el ⚙.
- En la franja compartida gana el ⚙ (o el avatar), que pinta encima.
- Fuera de la lista de la ficha: el enlace de créditos de «Acerca de» mide 126×12 en 360. Es un enlace de texto y no se tocó.

### 3.6 · V6 · la hoja sobre Rankings (vino) y sobre Retar

- **Se lee bien sobre vino.** El velo es el `--green-abyss` al 60 % y la hoja va en `--surface-modal`.
- **La hoja no trae ningún oro.** Los oros que se ven (el «+», la pestaña elegida y las medallas) quedan bajo el velo.
- **El anclaje no cuadra donde `.sal` usa el «traje apretado».** Rankings y Retar llevan `--pad: 2.4u` en apaisado bajo (`salas.css:1682-1686`); el lobby, `--lob-pad: 3.5u`. La hoja usa el del lobby:

| Celda | Hueco ⚙ → hoja | Borde derecho hoja − ⚙ |
|---|---|---|
| 1366×768 | 9,61 (en el lobby, 3) | **−6,61** (la hoja queda 6,61 px a la izquierda del ⚙) |
| 915×412 | 6,61 | −4,53 |
| Teléfonos en vertical y 1920 | igual que en el lobby | 0 |

---

## §4 · Lo que no cabe o rompe, con la prueba

1. **V1-A y V1-B no caben en teléfono vertical con nombre.**
   - A alarga la píldora +44 px en 360, +44 en 390 y +44 en 412. Los ~22 px libres de la barra (el `margin-left: auto` del ⚙) se gastan, y el resto lo pierde el nombre.
   - Quedan **2 letras en 360 y 3 en 390 y 412**, sea el nombre de 8 o de 15. La B deja 1–3.
   - No desborda nada: el nombre se recorta con «…» (`constancia.css`) y la barra no se sale.
   - Pruebas: `V1A_360x640.png`, `V1A-largo-zonas_*`, `V1B-*` y la tabla 3.1.
   - **En 915×412 y en escritorio las tres caben** con 15 letras.
2. **V1-B en escritorio:** el «+» sale de 56 px, mayor que la píldora (48,8). Se lee como un botón suelto, no como parte de la píldora (`V1B_1920x1080.png`).
3. **Sin estos cuatro arreglos, el camino Z no da 44**, aunque la geometría diga 44. Los midió el barrido de la primera corrida, y los cuatro ya están en `cfg1a.css`:
   - a. **Capas de la barra.** Hoy `lob-top`, `lob-centro`, `sal-cab` y `sal-cuerpo` comparten `z-index: 1` (`lobby.css:170-172`, `salas.css:166-168`) y gana el último del DOM. Lo que había:
     - las zonas de la barra se quedaban en **42** en 360 (el centro del lobby se comía su borde de abajo);
     - la casa y la flecha, en **36** (el cuerpo se comía el suyo).

     Arreglo: `.lobby > .lob-top { z-index: 2 }`, `.sal.es-anclada > .lob-top { z-index: 3 }` y `.sal.es-anclada > .sal-cab { z-index: 2 }`.
   - b. **La casa en Retar, Salas y Rankings es `position: static`** (`salas.css:1660`). Con el `::after` colgado de un ancestro, su zona medía **216×38 y tapaba la flecha entera**. Arreglo: `position: relative; inset: auto`. El `inset: auto` hace falta porque la casa trae `left` y `bottom` de su versión absoluta; sin él se fue 12,6 px a la derecha y arriba, encima del ⚙. Fue un error de mi primera corrida, corregido.
   - c. **La cifra tapada** (posicionada) se comía la zona del ojito: 35 en vez de 44. Arreglo: `pointer-events: none` en la cifra tapada.
   - d. El toast, por encima del velo (§3.3).
4. **La Sala de espera no admite el arreglo 3a tal cual.** Es `.sal` sin `es-anclada` y monta su velo y su diálogo de «Cancelar» **dentro de** `.sal-cuerpo` (`SalaEspera.jsx:510-656`). Subir allí la barra la pondría por encima de su propio velo. La lámina no la toca, y **sus zonas del ⚙, la casa y la flecha no están medidas**. El mini-perfil de Rankings no tiene el problema: va por portal (`MiniPerfil.jsx:109`).
5. **No medido:**
   - la cifra tapada con saldo de 1 dígito: los «••••» son más anchos que un «0» y podrían salirse de la caja;
   - PvP (`PartidaPvP.jsx`);
   - Armar mesa con la capa (comparte `PantallaChips`, así que se espera lo mismo que en Retar).

---

## §5 · Recomendación de Claude Code por vista

| Vista | Rector | **Claude Code** | Por qué |
|---|---|---|---|
| **V1** | A | **C** | La A no pasa la condición que la propia ficha puso: en 360, 390 y 412 deja el nombre en 2–3 letras **también con un nombre corto**. Además el disco de oro de 44 pesa mucho junto al CTA (ver `V1A_360x640.png`). Con la C, el «+» y el ojito tienen 44 de zona y no se mueve nada (O1), el nombre corto entra entero y la hoja no necesita reanclarse. Su precio: la zona tapa un 45 % de la cifra (que no es tocable) y deja 3,7 px de solape ⚙/casa en Retar y Salas en 360 (ver R-9). **Alternativa** si Victor quiere el «+» de 44 visible: A desde 600 px de ancho (donde caben 15 letras) y C por debajo; son dos geometrías y el arnés mide las dos (P-1). |
| **V2** | A | **A** | Mide igual (diferencia de 0,7 px) y no añade un control nuevo. La pastilla ya está en la fila; el interruptor es más claro, pero es un dibujo nuevo que la casa no tiene. |
| **V3** | A | **A** | Mismo gesto que «Acerca de». La fila sigue siendo un `<button>`, los dos botones son de 44 holgados (116 px de ancho en 360) y la dirección está siempre a la vista al abrir. La B convierte la fila en un `<div>` con dos tocables (no se puede anidar un botón en otro), la deja en dos líneas (59,7 px) y su «Copiar» visible mide 31 de alto. |
| **V4** | A | **A** | Es lo primero que se ve al abrir. Con la B, en 1366×768 la versión queda bajo el pliegue. |

---

## §6 · Lo que la 1a necesitará además de lo visto

| # | Qué | Dónde |
|---|---|---|
| R-1 | Los **cuatro arreglos de §4-3**, copiados de `cfg1a.css §1` y `§8` | Hoja aditiva nueva |
| R-2 | **La hoja pasa a cabecera fija + cuerpo desplazable.** Hay que partir el marcado: título y cuenta, luego un `div` con las filas. En 915×412 ya se desplaza hoy; con la cabecera fija, lo que se desplaza es la lista | `Lobby.jsx:292-368` |
| R-3 | **Al abrir «Acerca de» o «Enviar sugerencia», `scrollIntoView` del panel.** En 915×412 la fila «Acerca de» queda al pie de una ventana de 210 px y su contenido se abre por debajo, sin que se vea | Ídem |
| R-4 | **La hoja en las otras pantallas:** un componente propio con una hoja de estilo que no dependa de `.lobby` (la lámina usa un `div.lobby` aparte como atajo) **y que se ancle al `--pad` de cada pantalla**. Medido: −6,61 px en 1366×768 y −4,53 en 915×412 sobre Retar y Rankings | Componente nuevo |
| R-5 | **Sala de espera:** o se saca su diálogo a un portal y entonces se le aplica el arreglo de capas, o sus zonas quedan como están (P-3) | `SalaEspera.jsx:636-656` |
| R-6 | Si se elige V1-A: la **corrección de `top` de la hoja** (`cfg1a.css §3`), y vigilar `lob.6` | `lobby.css:612-616` |
| R-7 | **Ojito:** `aria-hidden` en los dígitos mientras están tapados y `aria-label` «Saldo oculto». La cifra transparente sigue en el DOM y un lector de pantalla la leería | `BarraSuperior.jsx` |
| R-8 | Corregir el comentario falso de `lobby.css:682-683` | `lobby.css` |
| R-9 | Si se elige V1-C: en 360 las zonas de la casa y la flecha pisan 3,7 px las del ⚙ y el avatar. Arreglo calculado (no medido): que esas dos zonas crezcan **hacia abajo** (≈ −2,1 arriba y −10,6 abajo en vez de −6,35 y −6,35). Debajo quedan ≈30 px hasta el rótulo «RETO», que no es tocable, y algo más hasta los chips (leído en la captura, no medido) | Hoja aditiva |
| R-10 | **La puerta nueva del arnés** (R-6 de la Fase 0): `medir()` de `guion.js` (zona geométrica + barrido de `elementFromPoint` + solapes entre tocables) sirve de base para un modo `diagDSK cfg` | `scripts/` |

---

## §7 · Preguntas para Victor

1. **P-1 · V1.** ¿C (recomendada), A (el «+» de 44 a la vista a cambio del nombre en el teléfono), o A desde 600 px de ancho y C por debajo?
2. **P-2 · Los puntos del ojito.** Hoy ocupan el ancho de la cifra que tapan (lo decidido, O1). Pero ese ancho delata los dígitos: «••••» sobre 2.400 no mide lo mismo que sobre 12.400. ¿Vale, o prefiere un ancho fijo (la caja reservada de 4,6 ch que ya existe)?
3. **P-3 · Sala de espera.** ¿Entra en la 1a (sacar su diálogo a un portal) o se queda fuera del piso de 44 por ahora?
4. **P-4 · Teléfono acostado.** ¿Cabecera fija también ahí (la lista se queda en 210 px), o en apaisado bajo la cabecera se desplaza con la lista, como hoy?

---

## §8 · `git status`

```
?? docs/reportes/AJILEI_CFG-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_CFG-1_Fase1aL_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/cfg1a/
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
```

Hay dos entradas más de las que pedía la ficha («solo el informe nuevo y lo de MOT-1»):
- `laminas/cfg1a/`, que es la lámina misma;
- el informe de la Fase 0 de CFG-1, que tampoco tiene commit.

Nada de `src/`, `scripts/`, `supabase/` ni `public/`. Sin commits. **STOP-L.**
