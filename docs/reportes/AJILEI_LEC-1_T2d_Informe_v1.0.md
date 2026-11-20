# AJILEI · LEC-1 · Tanda 2-d · Los cinco rojos de `completo` · Informe · v1.0

- **Fecha:** 2026-11-20 · **Base:** `0db1005` (LEC-1 publicada) · **Ficha:** `AJILEI_LEC-1_T2d_v1.0.md`.
- **Corrida:** la segunda `completo`, sobre `0db1005`, con 74 varas: 69 verdes y 5 en código 1, que son `msg`, `cap`, `vc`, `tam` y `sal`.
- **Veredicto:** cuatro son instrumento y una es producto. `tam` es un defecto real de `letra.css`: se para ahí y no se toca `src/`.

---

## 1 · Los cinco, uno a uno

### `msg` · instrumento conocido, sin tocar

- **Qué mide:** la frase del óvalo (compositor, jugado, fin, Δ larga, caza) y el barrido de cajas con «Heptacoins».
- **Qué midió distinto:** solo `msg·barrido «Heptacoins» · FALLA · 0 medidas · 0 cajas`. El resto salió verde: compositor 92 casos, jugado 7/7, fin 1/1, Δ larga 7/7 y caza 2/2.
- **Veredicto:** es la excepción declarada de INV-22 («un rojo solo por barrido … 0 medidas, con el resto verde, no es una regresión»). Queda anotado como conocido.

### `cap` · instrumento: la mesa de la Portada con la letra vieja

- **Qué mide:** `cap.regresion` compara la foto de la mesa (semilla 5, «A las 3 — Tú abre.») con su maestra de `maestras/portada/`. La vara exige Δ ≤ 2 en el 99,9 % de los píxeles y Δmáx ≤ 40.
- **Qué midió distinto:**

  | Vista | Contra | Δ ≤ 2 | Δmáx | Píxeles distintos |
  |---|---|---|---|---|
  | v | `mesav.png` | 98,920 % | 217 | 35 881 |
  | h | `mesah.png` | 98,628 % | 234 | 35 008 |
  | pc | `mesapc.png` | 99,994 % | — | — (verde) |

- **Veredicto:** instrumento. Las maestras son de VIS-1 (2026-11-03), anteriores a LEC-1.
- **Lo que se hizo:** `node scripts/diagPUE.mjs cap --sellar` sobre la build de `0db1005`, con el guion, la semilla y la receta de siempre. Sella las tres maestras y `cap.json` de una vez, y solo con todas sus puertas en verde:

  ```text
  cap.estable v 360×704@3 · Δ≤2: 100.000 % · Δmáx 0 · 0 px distintos
  cap.estable h 686×360@3 · Δ≤2: 100.000 % · Δmáx 0 · 0 px distintos
  cap.ogRecorte h 686×360@3 · caja dorada 2016×1044 · cubrir corta 4.6 px CSS por lado en x y 0.0 en y (≤ 6)
  cap.estable pc 1366×768@2 · Δ≤2: 100.000 % · Δmáx 0 · 0 px distintos
  SELLADO · mesav.png, mesah.png, mesapc.png + cap.json → maestras/portada/
  ── diagPUE cap · 28 mediciones · 0 en rojo → código 0 · 0db1005
  ```

- **Comprobación a ojo, maestra vieja contra nueva.** Se contaron los píxeles con Δ > 40 y se miraron las cajas de lo distinto y las ampliaciones:
  - **Vertical** (18 096 px con Δ > 40):
    - cambian «Mano #1», MANO y TURNO, «Mesa 200» y «Comodín activo · vale 11», que pasa a 9 px;
    - el Pozo y «A las 3 — Tú abre.» suben ≈ 1 px dentro del óvalo, porque el comodín creció debajo. El contorno del óvalo no se mueve (INV-04).
  - **Horizontal** (21 274 px con Δ > 40):
    - cambian «Mano #1», la crónica, «Apostar 200», «Pasar», «Retirarse», los cuatro ×N y «Mesa 200»;
    - la columna de la barra propia («20s», «Tú», «3600») sube ≈ 1 px.
  - **Escritorio:** 271 px con Δ > 2 y ninguno con Δ > 40. Es ruido de raster: `letra.css` no entra en `[data-escala]`.
  - **Igual en las tres:** el tapete, las cartas (3 de Espadas, Rey de Espadas, As de Copas, Rey de Bastos, 5 de Oros), los cuatro «Igualó», el pozo 2000 y el saldo 3600.
- **Lo que no se regeneró:** sigue el precedente de VIS-1, que también re-selló sin rehacer las imágenes públicas. Queda como pendiente en Invariantes §6.
  - **La tarjeta social** (`public/og-image-v2.jpg`) no sale de este guion, sino de `gen-portada-assets.mjs`. Ese guion manda subir el número del nombre (v3) y cambiar `index.html` al cambiar la imagen, y `index.html` queda fuera del mapa de esta tanda.
  - **El teléfono de la escena 5** (`src/assets/portada/dis_telefono.webp`) se hornea con Blender desde `mesav.png` y vive en `src/`, que esta tanda no puede tocar.
- **Peso:** las maestras no viajan al cliente, así que `1.8b` no cambia.

### `vc` · instrumento: la vara deshacía la reserva de la 2-a

- **Qué mide:** `vc·jugado`, en la mesa 2 a 1366×768. Sobre una victoria humana de verdad, toma las 13 anclas de la mesa durante la celebración y después de cortarla con un toque. Exige Δ ≤ 0,02 px (p2), además del sonido y el toque.
- **Qué midió distinto:** `Δ=10.19 (.pbr-chips)`, con «durante» 950 Heptacoins y «después» 1050 Heptacoins. Las otras 12 anclas, el sonido, el toque y la secuencia, bien.
- **La causa:** desde ARN-3d, la segunda toma escribe en `.pbr-chips` el texto de la primera («950»), para comparar la misma cifra, porque la retención de VIS-3c movía la caja un dígito. La 2-a de LEC-1 arregló justo eso en el producto. Mientras retiene, la caja reserva el ancho de la cifra final (`data-reserva-cifra` y `--cifra-final`), y después del toque esa reserva ya no está. Al igualar el texto, la vara medía «950» sin reserva contra «950» con reserva: fabricaba los 10,19 px que la 2-a quitó. Es la misma cifra que daba el control sin reserva de la 2-a en T1.
- **Veredicto:** instrumento, por la 2-a de LEC-1 y no por la letra.
- **Lo que se hizo** (`scripts/diagDSK.mjs`):
  - **`__vcReserva`** lee en «durante» la reserva y su cifra.
  - **Si la reserva coincide con la cifra de «después»,** se compara contra la segunda toma tal cual, sin igualar: la caja de «durante» ya medía la final.
  - **Si no hay reserva, o la cifra es otra,** se iguala como antes.
  - La vara sigue exigiendo 0,02 px en las 13 anclas.
- **Control rojo, `vc 2 --sin-reserva`.** Quita las dos reglas de la reserva de la hoja viva:

  ```text
  vc·jugado m2 · FALLA … Δ=9.2 (.pbr-chips) …
    vc·jugado · .pbr-chips con la reserva de la cifra final «1100» (LEC-1 2-a): «durante» contra «después» tal cual (900 Heptacoins → 1100 Heptacoins) · … · CONTROL --sin-reserva (no es la vara)
  ── VC: 5/5 celdas · jugado 0/1 · reloj+mute 1/1 · guardias 2/2 · decisor OK · ROJO
  ```

### `sal` · instrumento: el texto nuevo de la Llena

- **Qué mide:** `sal.6` en `opciones-llena`. Son cuatro tarjetas, con la línea 2 de cada una, cuáles están vivas, cuáles fuera, el orden, ninguna línea cortada y la misma altura.
- **Qué midió distinto:** solo el texto, en los seis tamaños:

  | | Antes | Ahora |
  |---|---|---|
  | Mesa de 3 · 200 | «Te faltan 5.000 HC · Entrada 10.000 HC» | «Faltan 5.000 · Entrada 10.000» |
  | Mesa de 5 · 5.000 | «Te faltan 245.000 HC · Entrada 250.000 HC» | «Faltan 245.000 · Entrada 250.000» |
  | Mesa de 4 · 100 | «2/4 sentados · Entrada 5.000 HC» | «2/4 sentados · Entrada 5.000» |

  Todo lo demás estaba bien: 0 cortadas, alturas iguales (54,23 a 80,39 según el tamaño), las de fuera al final y atenuadas.
- **Veredicto:** instrumento. Es el texto que LEC-1 1-a cambió a propósito (`sal.opciones.mesa.faltan` y `sal.opciones.mesa.entrada` en `src/config/textos.es.js`).
- **Lo que se hizo** (`scripts/diagSAL.mjs`):
  - La línea esperada se arma con esas dos claves, importadas de `textos.es.js` y no copiadas. Lo demás sigue igual.
  - **Control rojo, `SAL_CONTROL=llena-vieja diagSAL sal opciones-llena`.** La vara vuelve a esperar el texto de antes:

  ```text
  ── sal · las salas PvP ── CONTROL llena-vieja (no es la vara) · 0/6 celdas
      FALLA 640x360 (móvil landscape) · sal.6   … (los seis tamaños)
  ```

### `tam` · PRODUCTO: Armar mesa en una ventana baja de portátil

- **Qué mide:** el barrido de INV-55, con laptop a 1366 (rueda) y tableta a 1280 (arrastre), de 521 a 831 de alto. tam.3 pide que el gesto no mueva el botón anclado. tam.6 pide que, donde las filas no caben, el gesto las recorra hasta el final sin moverlo.
- **Qué midió distinto:** tam.3 y tam.6 en `armar` a 521, 531 y 541, en los dos perfiles. La sonda midió, con y sin las reglas de Salas de `letra.css`, en el mismo build:

  | Alto | Con `letra.css`: filas que no caben | Botón tras el gesto | Sin `letra.css` |
  |---|---|---|---|
  | 521 | 7 px | 460,5 → 454,5 (sube 6) | 0 px · quieto |
  | 531 | 5 px | 470,3 → 465,3 (sube 5) | 0 px · quieto |
  | 541 | 2 px | 479,3 → 477,3 (sube 2) | 0 px · quieto |
  | 551 y más | 0 | quieto | 0 · quieto |

- **La regla:** quitando una a una las reglas de Salas de `letra.css` a 1366×521, solo una devuelve las filas a 0:

  ```css
  @media (orientation: landscape) and (max-height: 599.98px) {
    .sal .sal-modo .sal-modo-d { font-size: calc(var(--u) * 3.55); line-height: 1.103 }
  }
  ```

  A 1366×521, `--u` = `clamp(3.2px, 1vmin, 6px)` vale 5,21 px, y la descripción del modo mide 18,5 px. La media del teléfono (`max-height: 599.98px`, que es `--u` < 6) también atrapa la ventana baja de un portátil o de una tableta. Ahí Armar mesa desborda unos píxeles, y el botón anclado se desplaza con las filas.
- **Veredicto:** producto. LEC-1 no debía mover el botón anclado (INV-55), y el arreglo está en `src/styles/letra.css`. Se para aquí: no se toca `tam` ni `src/`.
- **Por qué no salió antes:** `tam` no corrió en ninguna tanda de LEC-1. `lec.mapa` mide la letra en T1, T2, T3 y T6, y ninguno es una ventana de 1366 de ancho y menos de 600 de alto.

## 2 · Las varas repetidas

Las cuatro varas de instrumento se repitieron enteras, sobre el árbol de la 2-d: `src/` igual que en `0db1005`, en 4173 y 5173 como en `completo`. `tam` no se repitió, porque su rojo es producto y sigue ahí.

```text
── diagPUE cap · 31 mediciones · 0 en rojo → código 0
   cap.regresion v 360×704@3 · Δ≤2 100.000 % · Δmáx 0 · 0 px distintos
   cap.regresion h 686×360@3 · Δ≤2 100.000 % · Δmáx 0 · 0 px distintos
   cap.regresion pc 1366×768@2 · Δ≤2 99.994 % · Δmáx 16
── MSG: compositor OK (92 casos) · jugado 7/7 · fin 1/1 · Δ larga 7/7 · caza 2/2 · barrido OK (2 cajas) · VERDE
── sal · las salas PvP ── 114/114 celdas · verde → código 0
── VC: 20/20 celdas · jugado 1/1 · reloj+mute 1/1 · guardias 2/2 · decisor OK · VERDE
   vc·jugado m2 · OK … Δ=0 · .pbr-chips con la reserva de la cifra final «1050» (LEC-1 2-a): «durante» contra «después» tal cual (950 Heptacoins → 1050 Heptacoins)
── diagDSK tam · rojo (producto, §1): sin repetir
```

- **`msg`:** esta vez el barrido encontró 8 medidas, así que salió verde entero. Su excepción de INV-22 sigue escrita.
- **`vc·jugado`:** es la misma mano que dio 10,19 en `completo` (950 → 1050), y ahora mide Δ = 0.

## 3 · Controles

`npm run varas -- --solo eslint,vitest,build,guiones,1.8b`: las cinco con código 0.

| Vara | Resultado |
|---|---|
| eslint | 0 errores, 0 avisos |
| vitest | 113/113 archivos, 3063 pruebas, 0 fallidas |
| build | verde |
| guiones | verde |
| `1.8b` | **179,4 KiB**, igual que en la tanda 2 (techo 200 y meta 185). Las maestras no viajan al cliente |

**Lo que entra.**
- **`scripts/diagDSK.mjs`:** `vc·jugado` con la reserva, y la bandera `--sin-reserva`.
- **`scripts/diagSAL.mjs`:** la Llena con el texto importado, y `SAL_CONTROL=llena-vieja`.
- **Maestras:** las tres de `maestras/portada/` y `cap.json`.
- **Documentos:** Invariantes §6 (la nota y el pendiente de `diagPUE cap`), este informe y el cierre de LEC-1.

**Lo que no entra:** nada de `src/`. El defecto de `tam` espera la decisión de Victor y del rector.
