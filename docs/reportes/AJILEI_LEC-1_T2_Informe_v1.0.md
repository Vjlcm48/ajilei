# AJILEI · LEC-1 · Letra legible · Informe de la tanda 2 · v1.0

- **Fecha:** 2026-11-19 · **Base:** `d8285b1` (los cuatro commits de la tanda 1) · **Ficha:** `AJILEI_LEC-1_T2_v1.0.md`.
- **Qué entra:** el arreglo de `vuelo humano` (2-a), y las Invariantes, este informe y el cierre (2-b). Sin push de `main`.

---

## 1 · `vuelo humano` (2-a)

**El control rojo, antes de tocar nada.** Es el último log de la vara, sobre `b9474c7` (`%TEMP%\varas-mwhrzfi8\vuelo.log`):

```text
Δ dx=10.33 dy=0.09 · pozo 700→0 · saldo ["500"]→1250 · FALLA [septimaEnDestino]
```

**La causa** (Fase 0 §E.3):
1. El primer render del pago enseña la cifra final (1250), y ahí se mide el destino.
2. Al armarse la retención de VIS-3c, la cifra pasa a la retenida (500).
3. La barra va alineada a la derecha. Con un dígito menos, la moneda se corría un dígito.

**El arreglo.** Mientras el humano retiene su saldo, la cifra conserva el ancho de la final:

- **`GameTable.jsx`.** El `.pbr-chips` de la barra propia lleva `data-reserva-cifra` y `--cifra-final` (la cifra final, como cadena) solo mientras `retencion.winner === 0`.
- **`celebracion.css`.** Es la hoja libre de la celebración, que se carga con la mesa. Ahí va la regla: la caja de la cifra lleva una copia invisible y sin alto de la final (`::before` con `content: var(--cifra-final)`, en columna), así que mide lo mismo que medirá al aterrizar. No toca la alineación, no usa `!important` y `gameTable.css:265-266` queda igual.
- **Por qué no un mínimo en `ch`,** como recomendaba la Fase 0. Se probó primero y dejaba un resto: 0,74 px en T1 y 0,95 en T6, porque «1250» no mide 4 ch en Arial negrita. En el teléfono la fuente es otra y el resto cambiaría. La copia de la cifra es exacta con cualquier fuente.
- **`useCelebracion.js:20-26`.** Solo cambia el comentario. Ahora dice la verdad: la barra sí cambia entre medir y dibujar, por la retención, y por eso la cifra reserva el ancho de la final. La medición y la espera no cambian.
- **`diagDSK.mjs`.** La excepción solo estaba en un comentario (`:12470-12471`), que ahora cuenta que se retiró. No había lista de rojos conocidos, `AVISO_*` ni tolerancia especial, así que la vara no cambia.

**Las cifras.** Con la sonda de la Fase 0 («cambiando solo el número»), mesas de 2 y 5, saldo 500 → 1250. Cada camino reproduce su secuencia en el DOM:
- se mide con la cifra final;
- luego se retiene, en espera con volteo y en vuelo directo sin él;
- y al final se aterriza.

Los dos caminos dejan la barra en los mismos estados: solo cambia cuánto dura la espera.

| Tamaño | Con volteo (`showdown.mp3`) | Sin volteo (todos se retiran) | Sin la reserva (control) |
|---|---|---|---|
| **T1** 360×640 | **dx = 0** · salto 0 | **dx = 0** · salto 0 | 10,19 |
| **T6** 1920×1080, zoom 1,3 | **dx = 0** · salto 0 | **dx = 0** · salto 0 | 13,25 |

- **500 → 950 (mismos dígitos):** dx 0 y salto 0 en T1, T3 y T6. La reserva no mueve nada en el caso que ya iba bien.
- **T3, alineada a la izquierda:** la cifra sigue en x = 52 en los tres casos. La reserva no la desplaza.
- **El alto de la cifra no cambia:** 20,69 en T1, 21,59 en T3 y 26,91 en T6.

**`vuelo --semilla=1`, entero:**

```text
vuelo humano m5 1920x1080 · manos=7 · monedas=7 · destino="0" (corroborado "0") · Δ dx=0.14 dy=0.09 · escala decl=1.5 comp=1.49735 vs 1.5 · pozo 700→0 · saldo ["500"]→1250 · OK
vuelo ia     m5 1920x1080 · manos=1 · monedas=7 · destino="4" (corroborado "4") · Δ dx=0.23 dy=0 · escala decl=0.666667 comp=0.671392 vs 0.67 · pozo 4250→0 · saldo ["450"]→450 · OK
── VUELO · VERDE (2/2 escenarios) · N=7 · semillas humano=1 ia=1 → código 0
```

- **La misma mano que fallaba:** semilla 1, mano 7, saldo 500 → 1250. Antes daba dx = 10,33; ahora da 0,14. Ese resto es el muestreo del último fotograma, como el 0,23 de la IA.

## 2 · Invariantes (2-b)

- **INV-82.** Se retira la excepción de `vuelo humano` y queda su historia en una línea: qué era, qué la causaba y que se retiró en el commit 2-a. Las semillas de `h1`, `z1` y `vuelo` siguen como estaban. Suma la fuente `AJILEI_LEC-1_T2_Informe_v1.0.md`.
- **INV-88, nueva: la letra no baja de su piso.**
  - **Qué vigila:** los pisos de `LEC_PISOS` y las excepciones de `LEC_EXCEPCIONES`, con `diagDSK lec` (`lec.mapa`) en T1, T2, T3 y T6. Quien baje una letra del mapa la pone roja, y la arregla o escribe la excepción con su condición de retirada.
  - **Sus pisos:** los del óvalo del acostado (crónica 10, frase del resultado 11, mesas 3–5) y los de la cabecera («Mano #» 10,9; las insignias de la barra propia 11; «Mesa N» 12). No caben limpios en INV-61 ni en INV-64: la 61 es la ventana `hb` del portátil, y la 64 la frase en los tamaños con escala. Los nuevos son del teléfono sin escala. Cada piso vive en un solo sitio: su cifra, en `LEC_PISOS`; la regla, en INV-88.
  - **Por qué parcial:** las fuentes del teléfono real, y T4–T5, donde «Mano #» a 10,9 solo lo vigila el piso de 10 de `diagDSK tab`.
- **INV-04.** La letra dentro del óvalo del teléfono puede subir con el óvalo a Δ = 0 (Victor, 2026-11-18). «Pozo», «A igualar» y el comodín del acostado siguen a 8 porque a 9 no caben.
- **§2:** el recuento pasa a 88 filas, 82 vigiladas y 22 parciales. **§6:** la fila nueva de `diagDSK lec`. La línea «Actualizado» lo recoge todo.

## 3 · Controles

| Control | Resultado |
|---|---|
| eslint | 0 errores, 0 avisos |
| vitest | 113 archivos, 3063 pruebas, 0 fallidas: una más que en la tanda 1, la fila de INV-88 en `testInvariantes` |
| build | verde |
| guiones | verde: 22 migraciones, 11 guiones × 2 pasadas, `med_consultas` 14/14 |
| **`1.8b`** | **179,4 KiB**, igual que en la tanda 1: la regla vive en la hoja de la mesa, fuera de la entrada |
| `lec.mapa` | verde, 43 s |
| `vuelo --semilla=1` | verde en humano y en IA, código 0 |
