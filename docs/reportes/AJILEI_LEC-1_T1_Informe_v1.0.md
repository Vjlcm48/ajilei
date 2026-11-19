# AJILEI · LEC-1 · Letra legible · Informe de la tanda 1 · v1.0

- **Fecha:** 2026-11-19 · **Base:** `295ab7f` · **Ficha:** `AJILEI_LEC-1_T1_v1.0.md`.
- **Qué entra:** la hoja definitiva (1-a), las zonas de 44 del acostado (1-b), la vara `lec.mapa` (1-c) y este informe (1-d). Sin push de `main`. La tanda 2 (`vuelo humano`, Invariantes, cierre) va aparte.
- **Instrumento:** el medidor de la lámina, sin mando, en los seis tamaños de la Fase 0, y la vara `lec.mapa`. Las fuentes del teléfono real no se midieron: las cifras son con la pila de Windows. Victor ya miró la lámina en el S25.

---

## 1 · La letra, hoy → ahora

px visibles mínimos en cada pantalla, en T1 (360×640) · T2 (390×844) · T3 (640×360). Con el mando retirado, las 49 clases medidas dan exactamente las cifras del STOP-L de la variante elegida, y ⚙ y tienda dan las de hoy (diferencia 0 en los seis tamaños).

| Pantalla | Clase | Hoy | Ahora |
|---|---|---|---|
| Lobby | `.lob-nav-btn` | 10,4 · 11,3 · 10,4 | 12,9 · 14 · 12,9 |
| Lobby | `.cst-ficha` | 10,8 · 11,7 · 10,8 | 10,8 · 11,7 · **13** |
| ⚙ | `.tie-cfg-txt small` | 9,8 · 10,6 · 9,8 | 10,7 · 11,5 · 10,7 |
| Retar, Salas, Armar | `.sal-bloque h2` | 10,4 · 11,3 · 10,4 | 11,2 · 12,1 · 11,2 |
| Retar, Salas, Armar | `.sal-caja` | 11,2 · 12,1 · 11,2 | 11,2 · 12,1 · **11,5** |
| Armar mesa | `.sal-modo-d` | 10,4 · 11,3 · 10,4 | 11,5 · 12,4 · 12,8 |
| Salas | `.sal-mesa-l2` | 10,4 · 11,3 · 10,4 | 11 · 11,9 · 11 |
| Salas | Llena, la más larga | 8,2 · 8,9 · 10,4 | 10,7 · 11,9 · 11 |
| Salas | `.sal-vacio` | 11,9 · 12,9 · 11,9 | 12,9 · 14 · 12,9 |
| Salas | `.sal-unir` | 11,5 · 12,5 · 11,5 | 12,9 · 14 · 12,9 |
| Sala de espera | `.sal-esp-espera` | 12,2 · 13,3 · 12,2 | 12,9 · 14 · 12,9 |
| Sala de espera | «Tú» de la silla | 7,9 · 8,6 · 7,9 | 9,2 · 10 · 9,2 |
| Sala de espera | `.sal-esp-compartir`, `.sal-esp-salir` | 11,5 · 12,5 · 11,5 | 12,9 · 14 · 12,9 |
| Rankings | `.rnk-cab-lista` | 9,4 · 10,1 · 9,4 | 14 · 15,1 · 14 |
| Rankings | `.rnk-fin`, `.rnk-lugar` | 10,1 · 10,9 · 10,1 | 11 · 11,9 · 11 |
| Rankings | `.rnk-tu-l` | 10,4 · 11,3 · 10,4 | 11,4 · 12,3 · 11,4 |
| Rankings | `.rnk-sub` | 11,2 · 12,1 · 11,2 | 12,2 · 13,2 · 12,2 |
| Rankings | `.rnk-medalla`, `.rnk-pos` | 11,5–11,9 · 12,5–12,9 · 11,5–11,9 | 12,9 · 14 · 12,9 |
| Mesa | «Mano #» | 10 · 10 · 10 | 10,9 · 10,9 · 10,9 |
| Mesa | Insignias de la barra propia | 10 · 10 · 10 | 11 · 11 · 10 |
| Mesa | «Mesa N» | 11 · 11 · 11 | 12 · 12 · 12 |
| Mesa | Botones de acción | 12 · 12 · 11 | 12 · 12 · **12,5** |
| Mesa | Multiplicadores | 12 · 12 · 10 | 12 · 12 · **12,5** |
| Mesa | Pista de descarte | 11 · 11 · 11 | 11 · 11 · **12,5** |
| Óvalo | Crónica, mesas 3–5 | 13 · 13 · 9 | 13 · 13 · **10** |
| Óvalo | Frase del resultado, mesas 3–5 | 13 · 13 · 9 | 13 · 13 · **11** |
| Óvalo | Comodín | 8 · 10 · 8 | **9** · 10 · 8 |

**T4–T6:** «Mano #» pasa de 10 a 10,9 en T4 y T5 (`h`, factor 1). La Llena más apretada de T4 pasa de 12,4 a 16,1 por el texto corto. En T6 no cambia nada: el zoom de 1,3 ya daba 13 o más.

**Cómo está hecha la hoja** (`src/styles/letra.css`):

- Solo `font-size`. Nueve clases de texto llevan además el interlineado de hoy fijado, para que su caja no crezca, con razón ≥ 1,1 por si un día parten línea. Son `.tie-cfg-txt small`, `.sal-bloque h2`, `.sal-mesa-l2`, `.sal-modo-d`, `.rnk-fin`, `.rnk-lugar`, `.rnk-sub`, `.rnk-tu-l` y `.discard-hint`.
- Los botones conservan su caja exterior bajando su propio relleno lateral:

| Botón | Relleno lateral (T1) |
|---|---|
| `.sal-unir` | 12,6 → 10,3 |
| `.sal-esp-compartir` | 12,6 → 8,2 |
| `.sal-esp-salir` | 14,4 → 9,3 |
| Botones de acción (T3) | 8 → 3 |

- Gana por especificidad, sin `!important`. Sin el prefijo de la lámina, las 49 clases dan en los seis tamaños la misma cifra que la variante elegida en el STOP-L: no hizo falta tocar ninguna especificidad.
- En la pantalla de pantallas previas vale solo por debajo de 600 de lado corto (`--u` < 6); en la mesa, solo sin `data-escala`, salvo «Mano #» en `h`.

**La Llena:** `sal.opciones.mesa.faltan` = «Faltan {hc}» y `sal.opciones.mesa.entrada` = «Entrada {hc}». La clave es compartida: una mesa normal fuera de alcance también dice «Faltan 5.000», sin «HC».

## 2 · Lo que se mueve en la mesa (aprobado)

| Elemento | px |
|---|---|
| Cabecera (`.header-center`) | 3,9 (3,5 en T3) |
| Logo de la cabecera, T3 mesa 5 | 1,9 |
| Izquierda de la barra propia | 4,0 |
| Derecha de la barra propia | 3,9 |
| `.pbr-tags` | 3,4 (0,6 en T3) |
| Saldo, moneda y cronómetro de la barra propia | 0,6 |
| Sillas de la sala de espera | 1,5 a 1,8 |

El rectángulo del óvalo no cambia: Δ = 0 en las mesas 2, 3 y 5, en los seis tamaños. Lo vigilan las varas de TAB.

## 3 · Las zonas de 44 del acostado (1-b)

Solo `src/styles/tactilLobby.css`, §7 nuevo. Afecta al acostado del teléfono por debajo de 860 de ancho y fuera de Rankings. Medido con `elementFromPoint` en Salas, Armar mesa y Retar.

| Tamaño | Flecha | Casa | ⚙ |
|---|---|---|---|
| **640×360** | 44,8 × 41,8 → **44,8 × 44,6** | 44,8 × 41,8 → **44,8 × 44,6** | 40,1 × 44,8 → **44,1 × 44,8** |
| 780×360 (S25 acostado) | 44,8 × 39,1 → 44,8 × 42,3 | 44,8 × 41,8 → 44,8 × 44,6 | 40,6 × 44,8 → 44,6 × 44,8 |
| 844×390 | 44,9 × 42,4 → 44,9 × 44,4 | 44,9 × 43,4 → 44,9 × 44,7 | 43,9 × 44,9 → 47,9 × 44,9 |
| 915×412 | 44,8 × 44,6 (igual) | 44,8 × 44,6 (igual) | 45,3 × 44,8 (igual) |

- **Ningún píxel visible se mueve:** la huella de la barra y de la fila de la flecha es idéntica antes y después en los cuatro tamaños.
- **Flecha y casa** crecen como mucho 4 px hacia arriba y el resto hacia abajo. **El ⚙** crece como mucho 5 px hacia la izquierda; con 4, la ficha esperaba 3,7, llegaba a 43,1.
- **915×412:** la regla no llega, porque allí las tres ya miden 44. El cruce geométrico de las zonas del ⚙ y de la casa (1,11 px de alto) queda como estaba.
- **Con un nombre de 15 «W»** hay entre 243 y 403 px de aire entre el ⚙ y el «+» de la píldora.
- **Lo que queda corto:**
  - **Rankings no entra:** las pestañas empiezan 6,5 px bajo la flecha y la zona se las comería, y la del ⚙ ya cruza allí la de la casa. Sigue en 44,8 × 41,8 y 40,1 × 44,8 en 640×360.
  - **La flecha en 780×360** llega a 42,3, no a 44: el «+» de la píldora le corta 1,5 px por arriba. Mejora 3,2 px sobre hoy.

## 4 · La vara `lec.mapa` (1-c)

- **Dónde está:** `scripts/lec/lec.mjs`, modo `lec` de `diagDSK`, vara `lec.mapa`. Corre contra 5173 con la escala real.
- **Qué recorre:**
  - En T1, T2 y T3: lobby, ⚙, tienda (cuatro estantes), Rankings (cuatro pestañas), Retar y siete estados de `?sal=`.
  - En los cuatro tamaños (T1, T2, T3 y T6): ocho escenas de la mesa en mesas de 2, 3 y 5.
- **Qué comprueba:**
  - **`LEC_PISOS`:** 29 clases con su cifra aprobada, con tolerancia de 0,25 px. Una clase que no aparezca en su tamaño es roja.
  - **`LEC_EXCEPCIONES`:** 19 clases que no subieron, con su cifra de hoy.
  - **Nada bajo 9 px** fuera de las excepciones.
- **Tiempo: 41–43 s.** Entra en el perfil `commit` (y en `completo`), entre `pvp.lm` y `humo`. `orquesta.test.js` lo recoge.
- **Control rojo:** una copia de `letra.css` con «Mesa N» bajada de 12 a 11 px, inyectada con `--lec-css`:

```text
lec.mapa · ROJO · 29 pisos, 19 excepciones, 4 tamaños · 41 s · con hoja inyectada
  ✗ T1 .game-table-screen .player-bar .pbr-mesa: 11 px en «mesa 2 turno-propio», piso 12
  ✗ T2 .game-table-screen .player-bar .pbr-mesa: 11 px en «mesa 2 turno-propio», piso 12
```

- **Sin la copia:** `lec.mapa · VERDE · 41 s`, código 0.
- **Lo que no es de esta vara:** el óvalo a Δ = 0, que vigilan las varas de TAB, y la frase ≥ 10 en `hb` (INV-61).

## 5 · Controles

| Control | Resultado |
|---|---|
| eslint | 0 errores, 0 avisos |
| vitest | 113 archivos, 3062 pruebas, 0 fallidas |
| build | verde |
| guiones | verde |
| **`1.8b`** | **179,4 KiB** |
| `lec.mapa` | verde, 43 s |

`1.8b` hoy es 178,8, la ficha esperaba unos 179,1, y el techo es 200. Quitar la variante descartada y el prefijo ahorra poco comprimido: la hoja final pesa en gzip casi lo mismo que la de la lámina.

## 6 · Las excepciones (lo que no subió)

| Elemento | Se queda en | Por qué |
|---|---|---|
| «Pozo» y «A igualar», T3 | 8 | A 9 mueven la caja del pozo 2,8 px |
| Comodín, T3 | 8 | A 9 empuja la frase 11 px |
| Pastillas del ⚙ | 9,6 · 10,3 · 9,6 | Victor eligió A |
| `.vid-pastilla` | 9,5 · 10,3 · 9,5 | Victor eligió A |
| «Pronto» del estante | 9,3 | Se sale de la pantalla |
| «Te quedan 8 de 8 hoy» | 9,7 | Mueve la fila 0,6 px |
| Nombre en la silla | 9,7 | «MaracuchaBrava_» deja de caber |
| `.sal-aviso` | 10,4 | Mueve el bloque 0,8 px |
| Textos secundarios de la sala de espera | 10,4–10,8 | Mueven 0,7 a 3,2 px |
| `.rnk-familia` | 11,2 | Su caja crece 4,8 px |
| «Tú» de la barra propia | 11 | Se recorta a 12 en T3 |
| Insignias de los rivales | 10 | Mueven su cabecera 0,7–0,9 px |
| «Entendido», «Ahora no», «Omitir», «Salir de la mesa» | 12 | La caja crece 1,2 px |
| `.sal-chip`, `.lob-fila` | 13 y 12,2 | Cambian su caja o la de la hoja |

Todas están en `LEC_EXCEPCIONES`, con su cifra.

**Una corrección al informe de la Fase 0:** el `h2` «Rankings» de `.sal-bloque` está oculto (1×1 px). No era el límite de esa pantalla.

## 7 · Tres rojos que no son rojos (aprobados en el STOP-C)

Tres cifras se apartan de lo que pedía la ficha. Victor las aprobó el 2026-11-19 tal como están:

| Qué | Pedía la ficha | Queda | Por qué |
|---|---|---|---|
| Zona del ⚙ en el acostado | crecer 3,7 px a la izquierda | **crece 5 px** (40,1 → 44,1 en 640×360) | Con 4 px llegaba a 43,1. Ningún píxel visible se mueve y quedan 243–403 px de aire hasta el «+» con 15 «W». |
| Rankings | zona de 44 como en Salas | **fuera de la regla:** flecha y casa 44,8 × 41,8, ⚙ 40,1 × 44,8 en 640×360 | Las pestañas empiezan 6,5 px bajo la flecha, y la zona del ⚙ ya cruza allí la de la casa. Queda anotado, no abierto. |
| Flecha en el S25 acostado (780×360) | 44 | **44,8 × 42,3** | El «+» de la píldora le corta 1,5 px por arriba. Aun así mejora 3,2 px sobre hoy (39,1). |
