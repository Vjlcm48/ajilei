# AJILEI · LEC-1 · Letra legible · Informe de la tanda 2 · v1.0

- **Fecha:** 2026-11-19 · **Base:** `d8285b1` (los cuatro commits de la tanda 1) · **Ficha:** `AJILEI_LEC-1_T2_v1.0.md`.
- **Qué entra:** el arreglo de `vuelo humano` (2-a), y las Invariantes, este informe y el cierre (2-b). Tras el control de las IAS, el recableado de `diagDSK tab` (2-c, §4). Sin push de `main`.

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

## 4 · `diagDSK tab` con la letra de LEC-1 (2-c)

**El rojo.** Era el control de las IAS sobre `aa9cdb6`, que salió 18/19. `tab.resto` quedó en rojo:

```text
── TAB · ROJO · V-cel ✗ · V-fuera ✓ · V-h ✓ · V-tv ✓ · V-vuelo ✓ · V-giro ✓ · V-borde ✓ · V-hb ✓ · V-frontera ✗ · 1052 s
   V-cel   pares 25/25 bien (16 idénticos al píxel, …) frente a escala=1 · t3 0/88 byte a byte
   V-frontera 5/16 celdas bien
```

**No era un defecto.** Las dos referencias que la vara compara byte a byte son anteriores a LEC-1: la matriz T3 (`scripts/tab/ref/t3_matriz.csv`, de `9fef917`) y las filas sin atributo de `scripts/tab/ref/t2_geometria.json` (de `abc2ebc`). Las 99 filas cambiaban solo en lo que `letra.css` sube a propósito, con la cifra exacta de `LEC_PISOS`:

| Columna | Antes → ahora | Dónde |
|---|---|---|
| `f_mesa` («Mesa N») | 11 → 12 | todas |
| `f_mano` («Mano #») | 10 → 10,9 | las de turno |
| `f_boton` | 11 → 12,5 | las acostadas |
| `f_msg` (la crónica del óvalo) | 9 → 10 | las acostadas de las mesas 3–5 |
| `pie_bajo` | +0,5 o +0,6 px | la barra propia baja con «Mesa N»; sigue entre 23 y 67 px dentro de la ventana |

El óvalo (486 × 37,8 en el S25), las cartas, la caja, la ocupación, la altura de los botones, los `cabe_*` y los desplazamientos salían iguales al byte. Los 5 casos con `h` o `hb` salían verdes, porque `letra.css` vive fuera de `[data-escala]`: la frontera no se movió.

**Por qué no se vio antes.** `letra.css` toca el teléfono sin atributo, que es justo lo que vigila INV-57, y ni la tanda 1 ni la 2 corrieron `tab` antes del STOP-C. Lo vio el control de las IAS. Queda como lección en el cierre (§4).

**El recableado** (`scripts/tab/tab.mjs`). Las referencias no se resellan, porque se perdería la geometría vieja:
- **`filaEsperadaLec`** traduce la fila sellada a la esperada. Cambia solo las cuatro columnas de letra, con la cifra de `LEC_PISOS` (la vertical lee T1 y la acostada T3):
  - `f_boton`, solo en el acostado;
  - `f_msg`, solo en el acostado y en las mesas 3–5.
- **`juzgarFilaLec`** compara la fila medida con la esperada:
  - `pie_bajo` vale si está en [antes, antes + 0,6] y `cabe_pie` es `True`;
  - el resto va byte a byte, incluidos `oval_w` y `oval_h`.
  - Devuelve las columnas distintas, que el resumen escribe todas, una línea por celda.
- **Dónde se aplica:** en la matriz T3 de V-cel y en los 11 casos sin atributo de V-frontera.
- **Prueba sin navegador.** Con las 99 filas del log rojo de las IAS: 99 verdes con la letra de LEC-1. Con «Mesa N» devuelta a 11, 99 rojas; con el óvalo 0,1 px más ancho, también 99 rojas.

**El control rojo, `TAB_CONTROL=sin-lec`.** Quita de la hoja viva las dos reglas de «Mesa N» de `letra.css`, la vertical y la acostada. Si no encuentra exactamente dos, no mide. Resultado de `diagDSK tab cel frontera`:

```text
── TAB · CONTROL sin-lec (no es la vara) · ROJO · V-cel ✗ · V-frontera ✗ · 476 s
   V-cel   pares 25/25 bien (15 idénticos al píxel, …) frente a escala=1 · t3 0/88 byte a byte con la letra de LEC-1
     ✗ 915x412|5|reposo: f_mesa 12 → 11
     …
   V-frontera 5/16 celdas bien
     ✗ 915x412 Galaxy S25 acostado: distinta de hoy con la letra de LEC-1: f_mesa 12 → 11
     …
```

- **Rojas:** las 88 celdas de la matriz y los 11 casos sin atributo de la frontera, cada una con un solo motivo, `f_mesa 12 → 11`.
- **Siguen bien:** los 5 casos con atributo. El pie vuelve a su sitio de antes, que la tolerancia admite.

**El verde.** `tab.resto` (las nueve varas, en 4173, sobre `aa9cdb6` con la 2-c):

```text
── TAB · VERDE · V-cel ✓ · V-fuera ✓ · V-h ✓ · V-tv ✓ · V-vuelo ✓ · V-giro ✓ · V-borde ✓ · V-hb ✓ · V-frontera ✓ · 1219 s
   V-cel   pares 25/25 bien (16 idénticos al píxel, el resto equivalentes con la vara de cap) frente a escala=1 · t3 88/88 byte a byte con la letra de LEC-1
   V-tv    48/48 celdas bien
   V-h     24/24 celdas bien
   V-fuera 12/12 pantallas bien (sin referencia: solo la huella) · entrar y salir 3/3
   V-borde 40/40 celdas bien · referencia abc2ebc (vite preview de la base de TAB-2)
   V-hb    48/48 celdas bien
   V-frontera 16/16 celdas bien
── diagDSK tab · tab verde · aislamiento verde → código 0
```

- **V-vuelo:** cuatro vuelos y dos globos, todos a 0,02 px o menos.
- **V-giro:** los dos pasos ✓.
- **Ruido de fotos:** 1 de 44 comparaciones, con 1 repetición.
- **Tiempo:** 20 min 19 s, dentro del tope de 25 de la orquesta.

**Lo que la vara no ve** (también en INV-57):
- La matriz guarda el ancho y el alto del óvalo, no su posición; la cubren la caja y la ocupación.
- Los 25 pares sin `--ref` comparan con la escala forzada a 1 de la misma versión y no ven LEC-1. Con `--ref` en `9fef917` saldrían rojos por la letra.

**Documentos.**
- **INV-57:** la letra de LEC-1 es su segunda excepción declarada, con sus límites, y suma `src/styles/letra.css` a sus fuentes.
- **INV-61:** el iPad en ventana lleva esa letra, y V-frontera compara igual.
- **§6:** la fila de `diagDSK tab`, con `TAB_CONTROL=sin-lec`.
