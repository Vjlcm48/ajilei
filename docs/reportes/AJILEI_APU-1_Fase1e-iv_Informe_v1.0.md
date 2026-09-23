# AJILEI · APU-1 · Fase 1e-iv — Las bandas: de dónde viene la deriva · Informe v1.0

**Campaña:** APU-1 · **Fase:** 1e-iv · **Ficha:** `AJILEI_APU-1_Fase1e-iv_v1.0.md`
**Base:** `main` en `f9ee503` + 1a…1e-iii, sin commitear · `gameEngine.js` en `21c4d3f56318`
**Fecha:** 2026-09-18

---

## Veredicto, en una línea

**No había deriva.** Las celdas rojas de §D.6 del informe de 1e se midieron con una
apuesta de mesa distinta de aquella con la que se sellaron —`--unit 50`, el valor
por defecto, contra una vara sellada entera a `--unit 100`— y la clave de una
banda no lleva la entrada. Corrida a la entrada de la vara, **la vara sale verde
en 80 de sus 84 celdas**, y con el motor de 1e-ii sale verde en **32 de 32** de
las que se pudieron comparar, con el espejo de la mesa de dos reproduciéndose a
**0,00σ exactos**.

Lo único que 1e-iii mueve de verdad en el banco es **el azar en la mesa de dos**,
que es la firma de E-13 y estaba bien identificado en E-21.

El diagnóstico cierra en el **Paso 2** de la ficha, por la rama que la propia
ficha preveía: *«la corrida de §D.6 no era comparable»*. El Paso 3 no se corre
(regla 4: un paso que da causa cierra el diagnóstico).

---

## §A · Procedencia por celda

### A.1 · Lo primero que hay que decir: la vara no registra procedencia

La ficha pedía levantar las 84 celdas con **los blobs registrados** de
`aiPlayer`, `gameEngine` y `deck`, y marcar cada una como MISMO MOTOR u OTRO
MOTOR. Ese paso **no se puede ejecutar como está escrito**, y por una razón que
es en sí misma el primer hallazgo:

> **En `scripts/apu1_bandas.json` no hay un solo blob.** `grep -c blob` sobre la
> vara devuelve `0`. `commitOrigen` es `null`. Ninguna celda registra contra qué
> árbol se midió.

«Bandas selladas y rastreadas» quería decir que la vara vive en un archivo
rastreado por git —eso sí es cierto, y fue la decisión 5 del rector en 1c-2-iii—,
no que cada celda llevara la huella de su motor. La sospecha de procedencia del
rector era la correcta; lo que no había era con qué comprobarla.

Lo que la vara **sí** registra por celda es `origen` (el volcado del que salió) y
`tanda`. Y los volcados de origen, que siguen en disco, registran `siembra` y
—esto es lo que lo resuelve todo— **`configuracion.unit`**.

### A.2 · Lo que se pudo reconstruir

| | |
|---|---|
| celdas | **84**, en 72 volcados de origen |
| tandas | `APU1-1c2-CONV` (36 celdas, n=5.000) · `APU1-1c2-F` (48 celdas, n=100.000) |
| siembra | **11** en toda la CONV · **23** en toda la F |
| apuesta de mesa | **100 en las 84**, sin una sola excepción |
| blobs | **ninguno, en ninguna celda** |

Las dos tandas son del mismo momento de 1c-2, así que **no hay celdas de motores
distintos entre sí**: la vara es homogénea. Lo que no se puede establecer desde la
vara es contra qué motor se selló *toda* ella, y eso queda como deuda (E-25).

### A.3 · Las 84 celdas

Media y error son los sellados, en unidades de apuesta. El veredicto es el de esta
tanda, corrida **a la entrada de la vara** con el motor final de 1e-iii.

| # | clave | media ± se (u) | unit | siembra | tanda del sello | blobs | veredicto 1e-iv |
|---|---|---|---|---|---|---|---|
| 1 | `mesa2\|avanzado\|aleatorio\|j0=avanzado\|n=5000` | -1.818 ± 0.059 | 100 | 11 | APU1-1c2-CONV | ninguno | **ROJA (-4.56σ)** |
| 2 | `mesa2\|basico\|aleatorio\|j0=basico\|n=5000` | -1.605 ± 0.055 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-3.06σ) |
| 3 | `mesa2\|pro\|aleatorio\|j0=pro\|n=5000` | -1.899 ± 0.069 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-2.64σ) |
| 4 | `mesa2\|avanzado\|espejo\|j0=avanzado\|n=5000` | +0.030 ± 0.081 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.14σ) |
| 5 | `mesa2\|basico\|espejo\|j0=basico\|n=5000` | +0.041 ± 0.039 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-0.76σ) |
| 6 | `mesa2\|pro\|espejo\|j0=pro\|n=5000` | +0.078 ± 0.083 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (0.33σ) |
| 7 | `mesa2\|avanzado\|manoso\|j0=avanzado\|n=5000` | +0.078 ± 0.059 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-1.14σ) |
| 8 | `mesa2\|basico\|manoso\|j0=basico\|n=5000` | +0.146 ± 0.047 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.36σ) |
| 9 | `mesa2\|pro\|manoso\|j0=pro\|n=5000` | -0.019 ± 0.053 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (0.40σ) |
| 10 | `mesa3\|avanzado\|aleatorio\|j0=avanzado\|n=5000` | -3.047 ± 0.079 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (0.50σ) |
| 11 | `mesa3\|basico\|aleatorio\|j0=basico\|n=5000` | -2.574 ± 0.062 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-1.47σ) |
| 12 | `mesa3\|pro\|aleatorio\|j0=pro\|n=5000` | -3.158 ± 0.076 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-1.37σ) |
| 13 | `mesa3\|avanzado\|espejo\|j0=avanzado\|n=5000` | -0.095 ± 0.143 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-0.64σ) |
| 14 | `mesa3\|basico\|espejo\|j0=basico\|n=5000` | -0.007 ± 0.046 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.45σ) |
| 15 | `mesa3\|pro\|espejo\|j0=pro\|n=5000` | +0.105 ± 0.154 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.74σ) |
| 16 | `mesa3\|avanzado\|manoso\|j0=avanzado\|n=5000` | +1.346 ± 0.123 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.80σ) |
| 17 | `mesa3\|basico\|manoso\|j0=basico\|n=5000` | +1.376 ± 0.116 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-2.06σ) |
| 18 | `mesa3\|pro\|manoso\|j0=pro\|n=5000` | +1.028 ± 0.112 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (0.55σ) |
| 19 | `mesa4\|avanzado\|aleatorio\|j0=avanzado\|n=5000` | -5.208 ± 0.119 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.41σ) |
| 20 | `mesa4\|basico\|aleatorio\|j0=basico\|n=5000` | -4.117 ± 0.101 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-1.36σ) |
| 21 | `mesa4\|pro\|aleatorio\|j0=pro\|n=5000` | -4.754 ± 0.106 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.11σ) |
| 22 | `mesa4\|avanzado\|espejo\|j0=avanzado\|n=5000` | +0.223 ± 0.288 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-2.20σ) |
| 23 | `mesa4\|basico\|espejo\|j0=basico\|n=5000` | +0.030 ± 0.063 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-1.20σ) |
| 24 | `mesa4\|pro\|espejo\|j0=pro\|n=5000` | +0.120 ± 0.250 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-0.33σ) |
| 25 | `mesa4\|avanzado\|manoso\|j0=avanzado\|n=5000` | +2.515 ± 0.259 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (0.65σ) |
| 26 | `mesa4\|basico\|manoso\|j0=basico\|n=5000` | +2.168 ± 0.212 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-1.06σ) |
| 27 | `mesa4\|pro\|manoso\|j0=pro\|n=5000` | +2.569 ± 0.246 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-1.73σ) |
| 28 | `mesa5\|avanzado\|aleatorio\|j0=avanzado\|n=5000` | -6.016 ± 0.127 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.96σ) |
| 29 | `mesa5\|basico\|aleatorio\|j0=basico\|n=5000` | -5.102 ± 0.119 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-0.90σ) |
| 30 | `mesa5\|pro\|aleatorio\|j0=pro\|n=5000` | -4.641 ± 0.105 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-1.22σ) |
| 31 | `mesa5\|avanzado\|espejo\|j0=avanzado\|n=5000` | +0.084 ± 0.306 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (0.45σ) |
| 32 | `mesa5\|basico\|espejo\|j0=basico\|n=5000` | +0.028 ± 0.054 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (0.30σ) |
| 33 | `mesa5\|pro\|espejo\|j0=pro\|n=5000` | -0.394 ± 0.248 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (1.57σ) |
| 34 | `mesa5\|avanzado\|manoso\|j0=avanzado\|n=5000` | +2.830 ± 0.318 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-0.75σ) |
| 35 | `mesa5\|basico\|manoso\|j0=basico\|n=5000` | +3.487 ± 0.303 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-0.25σ) |
| 36 | `mesa5\|pro\|manoso\|j0=pro\|n=5000` | +3.210 ± 0.305 | 100 | 11 | APU1-1c2-CONV | ninguno | VERDE (-2.43σ) |
| 37 | `mesa5\|avanzado\|manoso\|j0=avanzado\|e=15\|n=100000` | +2.222 ± 0.037 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-2.16σ) |
| 38 | `mesa5\|basico\|manoso\|j0=basico\|e=15\|n=100000` | +2.353 ± 0.038 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-2.45σ) |
| 39 | `mesa5\|pro\|manoso\|j0=pro\|e=15\|n=100000` | +2.041 ± 0.035 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.57σ) |
| 40 | `mesa2\|basico\|manoso\|j0=basico\|e=50\|n=100000` | +0.161 ± 0.012 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (0.90σ) |
| 41 | `mesa2\|avanzado\|aleatorio\|j0=avanzado\|n=100000` | -1.796 ± 0.014 | 100 | 23 | APU1-1c2-F | ninguno | **ROJA (-18.15σ)** |
| 42 | `mesa2\|avanzado\|espejo\|j0=avanzado\|n=100000` | -0.003 ± 0.017 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (0.60σ) |
| 43 | `mesa2\|avanzado\|espejo\|j0=basico\|n=100000` | -0.268 ± 0.015 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.38σ) |
| 44 | `mesa2\|avanzado\|manoso\|j0=avanzado\|n=100000` | +0.168 ± 0.012 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-0.96σ) |
| 45 | `mesa2\|avanzado\|pasivo\|j0=avanzado\|n=100000` | -1.063 ± 0.018 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (0.89σ) |
| 46 | `mesa2\|pro\|aleatorio\|j0=pro\|n=100000` | -1.869 ± 0.015 | 100 | 23 | APU1-1c2-F | ninguno | **ROJA (-20.56σ)** |
| 47 | `mesa2\|pro\|espejo\|j0=pro\|n=100000` | -0.049 ± 0.019 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (1.62σ) |
| 48 | `mesa2\|pro\|espejo\|j0=avanzado\|n=100000` | -0.171 ± 0.016 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.03σ) |
| 49 | `mesa2\|pro\|espejo\|j0=basico\|n=100000` | -0.421 ± 0.018 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-0.52σ) |
| 50 | `mesa2\|pro\|manoso\|j0=pro\|n=100000` | +0.083 ± 0.012 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (0.42σ) |
| 51 | `mesa2\|pro\|pasivo\|j0=pro\|n=100000` | -1.460 ± 0.020 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (0.70σ) |
| 52 | `mesa3\|avanzado\|aleatorio\|j0=avanzado\|n=100000` | -3.098 ± 0.018 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-2.31σ) |
| 53 | `mesa3\|avanzado\|espejo\|j0=avanzado\|n=100000` | -0.060 ± 0.031 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.10σ) |
| 54 | `mesa3\|avanzado\|espejo\|j0=basico\|n=100000` | -0.958 ± 0.023 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (1.47σ) |
| 55 | `mesa3\|avanzado\|manoso\|j0=avanzado\|n=100000` | +1.341 ± 0.028 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (0.71σ) |
| 56 | `mesa3\|avanzado\|pasivo\|j0=avanzado\|n=100000` | -2.014 ± 0.023 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.52σ) |
| 57 | `mesa3\|pro\|aleatorio\|j0=pro\|n=100000` | -3.150 ± 0.018 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-2.67σ) |
| 58 | `mesa3\|pro\|espejo\|j0=pro\|n=100000` | +0.013 ± 0.034 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (1.08σ) |
| 59 | `mesa3\|pro\|espejo\|j0=avanzado\|n=100000` | -0.394 ± 0.031 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.04σ) |
| 60 | `mesa3\|pro\|espejo\|j0=basico\|n=100000` | -1.159 ± 0.023 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-3.13σ) |
| 61 | `mesa3\|pro\|manoso\|j0=pro\|n=100000` | +1.251 ± 0.027 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (0.45σ) |
| 62 | `mesa3\|pro\|pasivo\|j0=pro\|n=100000` | -2.554 ± 0.026 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-0.96σ) |
| 63 | `mesa4\|avanzado\|aleatorio\|j0=avanzado\|n=100000` | -5.172 ± 0.026 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-0.53σ) |
| 64 | `mesa4\|avanzado\|espejo\|j0=avanzado\|n=100000` | +0.143 ± 0.063 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-0.83σ) |
| 65 | `mesa4\|avanzado\|espejo\|j0=basico\|n=100000` | -2.251 ± 0.041 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (1.20σ) |
| 66 | `mesa4\|avanzado\|manoso\|j0=avanzado\|n=100000` | +2.823 ± 0.060 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-3.12σ) |
| 67 | `mesa4\|avanzado\|pasivo\|j0=avanzado\|n=100000` | -4.545 ± 0.041 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.01σ) |
| 68 | `mesa4\|pro\|aleatorio\|j0=pro\|n=100000` | -4.696 ± 0.024 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-0.99σ) |
| 69 | `mesa4\|pro\|espejo\|j0=pro\|n=100000` | +0.267 ± 0.057 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-3.47σ) |
| 70 | `mesa4\|pro\|espejo\|j0=avanzado\|n=100000` | -0.205 ± 0.057 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.34σ) |
| 71 | `mesa4\|pro\|espejo\|j0=basico\|n=100000` | -2.188 ± 0.037 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.51σ) |
| 72 | `mesa4\|pro\|manoso\|j0=pro\|n=100000` | +2.576 ± 0.056 | 100 | 23 | APU1-1c2-F | ninguno | **ROJA (-4.48σ)** |
| 73 | `mesa4\|pro\|pasivo\|j0=pro\|n=100000` | -4.701 ± 0.039 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-0.39σ) |
| 74 | `mesa5\|avanzado\|aleatorio\|j0=avanzado\|n=100000` | -5.786 ± 0.029 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.85σ) |
| 75 | `mesa5\|avanzado\|espejo\|j0=avanzado\|n=100000` | +0.107 ± 0.067 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (1.53σ) |
| 76 | `mesa5\|avanzado\|espejo\|j0=basico\|n=100000` | -2.179 ± 0.047 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.42σ) |
| 77 | `mesa5\|avanzado\|manoso\|j0=avanzado\|n=100000` | +2.955 ± 0.068 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-3.68σ) |
| 78 | `mesa5\|avanzado\|pasivo\|j0=avanzado\|n=100000` | -5.167 ± 0.046 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (1.02σ) |
| 79 | `mesa5\|pro\|aleatorio\|j0=pro\|n=100000` | -4.721 ± 0.024 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.66σ) |
| 80 | `mesa5\|pro\|espejo\|j0=pro\|n=100000` | +0.185 ± 0.060 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-1.40σ) |
| 81 | `mesa5\|pro\|espejo\|j0=avanzado\|n=100000` | -0.155 ± 0.061 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-2.20σ) |
| 82 | `mesa5\|pro\|espejo\|j0=basico\|n=100000` | -2.273 ± 0.042 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (0.26σ) |
| 83 | `mesa5\|pro\|manoso\|j0=pro\|n=100000` | +2.615 ± 0.064 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (-3.93σ) |
| 84 | `mesa5\|pro\|pasivo\|j0=pro\|n=100000` | -5.313 ± 0.042 | 100 | 23 | APU1-1c2-F | ninguno | VERDE (1.44σ) |


**80 VERDE · 4 ROJA · 0 sin correr.** Las cuatro rojas se tratan en §B.4. Ninguna
celda es de OTRO MOTOR, porque ninguna celda dice de qué motor es.

---

## §B · Reproducción exacta

### B.1 · El oráculo: con siembra, la reproducción es exacta, no estadística

Los volcados de origen registran la siembra, así que una celda sellada se puede
volver a jugar **con los mismos dados**. Eso convierte el Paso 2 en algo mucho
mejor que una prueba de hipótesis: si nada de lo que el banco importa ha
cambiado, la cifra tiene que salir **idéntica**, no «dentro de banda».

La primera reproducción —`mesa4|avanzado|aleatorio`, n=5.000, siembra 11— no salió
idéntica: **−5,414 contra −5,208 sellado**, con 689 partidas contra 654. Repetida
cuatro veces más con la misma semilla dio −5,020, −5,176, −5,244, −5,049. Es decir:
**la corrida ni siquiera se reproduce contra sí misma**. Eso es E-27, y obligó a
elegir otra celda de sonda.

### B.2 · La sonda buena: una celda determinista, la más roja de todas

`pasivo` no tiene azar propio, así que con siembra sí es exactamente reproducible.
Es además el conductor que §D.6 dio por **−20,86σ** en `mesa4|avanzado`, y el que
sostenía E-20. Reproducida con su propio comando —n=100.000, siembra 23,
**`--unit 100`**:

| | fichas/mano (u) | se |
|---|---|---|
| sellado (`APU1-1c2-F`) | −4,5455 | 0,0412 |
| reproducido (motor de 1e-iii) | −4,4696 | 0,0424 |
| | **+1,28σ** | |

**La celda más roja del banco está a 1,28σ de su vara.** Lo que cambiaba no era el
producto: era el comando.

### B.3 · La causa, con nombre: la apuesta de mesa no está en la clave

Las 84 celdas se sellaron a `--unit 100`. `--unit` sin bandera vale **50**
(«la más baja REAL del juego»), y las corridas de §D.6 no la pasaron. La clave de
una banda lleva la mesa, el reto, el conductor, la entrada del jugador y el
volumen. **No lleva la apuesta de mesa.** Así que las dos celdas encajaron por
clave y se compararon.

Y no miden lo mismo, ni de lejos. La pila del banco son 5.000 fichas fijas: a
`--unit 100` eso son **50 apuestas de profundidad**, a `--unit 50` son **100**. Una
mesa el doble de profunda tiene otra frecuencia de all-in, otra duración de
partida y otro reparto. Medido sobre la misma celda y la misma semilla:

| `mesa4` avanzado aleatorio, n=5.000 | fichas/mano (u) | partidas |
|---|---|---|
| `--unit 100` (el de la vara) | −5,02 | 644 |
| `--unit 50` (el de §D.6) | **−6,16** | **404** |

Una unidad entera de diferencia sobre un error de 0,12–0,15: eso son los cinco,
diez y veinte sigmas que §D.6 leyó como deriva. El banco hizo lo que se le pidió;
la vara no tenía cómo negarse.

### B.4 · Con el motor a la entrada correcta: 80 de 84

Corrida entera la vara a `--unit 100` con el motor final:

| bloque | comparadas | verde | roja |
|---|---|---|---|
| n=5.000, básico | 12 | 12 | — |
| n=5.000, avanzado | 12 | 11 | mesa2 aleatorio, −4,50σ |
| n=5.000, pro | 12 | 12 | — |
| n=100.000, avanzado | 16 | 15 | mesa2 aleatorio, −16,87σ |
| n=100.000, pro | 16 | 14 | mesa2 aleatorio −18,86σ · mesa4 mañoso −4,48σ |
| duelos de espejo | 12 | 12 | — |
| celdas con entrada | 4 | 4 | — |

`pasivo`, que era el escándalo de E-20, queda **verde en sus ocho celdas**. `espejo`
sigue verde. `manoso` verde salvo una.

### B.5 · El A/B: con el motor de 1e-ii la vara está entera

Repetido el A/B de §D.6 —revertidos **sólo** A-1 y A-2, `abrirApuesta` hecha
identidad— pero esta vez **a la entrada de la vara**:

> **32 celdas comparadas, 32 VERDE**, en avanzado y en pro.
> El espejo de la mesa de dos, en los dos retos: **0,00σ**, reproducción exacta.

Blob del motor antes del A/B `21c4d3f56318`, durante `65c403358d92`, restaurado
`21c4d3f56318`, con `grep -c AB-TEMPORAL` a `0`. El árbol volvió idéntico.

Un cero exacto en dos celdas deterministas es la prueba fuerte que faltaba: **entre
el sello de 1c-2 y hoy, nada de lo que el banco importa ha cambiado el juego** —ni
`ajileiConfig`, ni los conductores, ni `pozos.js`, ni la pila. La bisección del
Paso 3 sobraría: no hay nada que bisecar.

### B.6 · Las cuatro rojas, una por una

- **Mesa 2 con el conductor al azar, en avanzado y en pro, a n=100.000.** Reales y
  estables. Tres semillas cada una, celda a celda: avanzado −19,55 / −17,96 /
  −18,44σ; pro −19,36 / −19,68 / −20,39σ. Con el motor de 1e-ii: +0,83σ y +1,87σ.
  **Es E-13, y sólo en la mesa de dos**, que es donde el rival es siempre el último
  pendiente. E-21 estaba bien visto.
- **La misma celda a n=5.000.** El efecto (−4,5σ) cae justo sobre el listón
  (3,93σ): en otra corrida de la misma celda salió **verde a 1,39σ**. Ahí sí había
  una banda infrapotenciada, y ahí sí valía la receta de E-17. Es lo que queda en
  pie de E-19 (§E).
- **Mesa 4, pro, mañoso, a −4,48σ.** No se sostiene. Corrida como celda suelta
  —que es como se selló— con tres semillas: **−3,05σ, −3,19σ, −1,25σ**, las tres
  dentro. El −4,48 salió de una corrida de matriz completa, y una celda dentro de
  una matriz no recibe los mismos dados que esa misma celda a solas (E-27). Es una
  celda marginal, no un hallazgo.

---

## §C · El grafo de importación

**No se corre**, por la regla 4 de la ficha: el Paso 2 dio causa. Se deja escrito
lo que se llegó a mirar antes de cerrarlo, porque descarta candidatos del rector:

- El banco alcanza `gameEngine`, `aiPlayer`, `deck`, `pozos`, `handEvaluator`,
  `entrada` y `ajileiConfig`.
- **Candidato 4 (la pila), descartado con una línea:** `PILA_INICIAL` está escrito
  a mano en `bancoNiveles.mjs` y vale `5000`; `economy.saldoInicial` valía 5.000 y
  `economy.pilaPruebas` vale 5.000. E-3 no movió una ficha del banco.
- **Candidatos 1, 2 y 3, descartados por el A/B:** dos celdas deterministas
  reproducen el sello a 0,00σ con el motor de 1e-ii y el árbol de hoy. Si la
  config, los conductores o `pozos.js` hubieran cambiado lo que el banco juega,
  ese cero no existiría.

---

## §D · El lector de bandas

Se abre `bancoNiveles.mjs` —que no es archivo protegido— en el sellador, el
comparador y la impresión del veredicto. Cuatro cosas:

**1 · La apuesta de mesa se sella con la celda (E-24).** `medidasDeCelda` registra
`unit`. No entra en la clave a propósito: añadirla dejaría huérfanas las 84 claves
ya selladas. El comparador se niega a comparar dos celdas que no la compartan y las
imprime como `VARA DE OTRA ENTRADA (sellada a --unit 100, corrida a 50)`.

**2 · El rescate para la vara vieja.** Las 84 celdas no traen `unit`, pero traen
`origen`, y el volcado de origen sí lo dice. Cuando ese archivo está en disco, la
procedencia se recupera **sin tocar un solo número sellado**. Cuando no está —un
`clone` limpio: `capturas-dsk/` no se rastrea—, la celda queda «sin procedencia» y
el lector lo dice. Con esto, **el defecto que fabricó §D.6 es imposible hoy**: la
misma corrida que entonces imprimió rojas ahora imprime

```
INCOMPARABLE · VERDE 0/0 comparables · ROJA 0 · OTRA ENTRADA 12 · OTRO MOTOR 0 · SIN VARA 4
```

y sale con código 2.

**3 · La huella del motor (E-25).** El sellador registra el blob `git hash-object`
de `gameEngine.js`, `aiPlayer.js` y `deck.js`, y la siembra de cada volcado. Una
vara cuyos blobs no son los de hoy imprime `VARA DE OTRO MOTOR (caducada)` y no
se compara. Para las 84 de `APU1-1c2` no hay huella y no se puede inventar: se
cuentan aparte y se propone el arreglo en §F.

**4 · El veredicto de cierre, en una línea que no se puede malleer (E-26).**

```
VERDE n/m comparables · ROJA k · OTRA ENTRADA e · OTRO MOTOR o · SIN VARA p [· sin procedencia q]
```

precedida de `INCOMPARABLE · ` en cuanto `e + o + p > 0`. La cuenta de celdas
comparadas existía desde D-16 de 1b; lo que faltaba es que **entrara en el
veredicto**. Una corrida de n=5.000 hoy empieza siempre por `INCOMPARABLE`, porque
`pasivo` no tiene celda a ese volumen — que es exactamente lo que E-20 descubrió
tarde.

El código de salida no cambia (1 si hay roja, 2 si no se comparó nada): la línea
es el aviso, y encadenar corridas no debe romperse por una celda nueva.

**Pruebas:** `scripts/testBancoBandas.test.js`, 7 casos. Lanzan el banco de verdad
contra una vara de usar y tirar: sellan y comprueban que la vara nace con `unit`,
`siembra` y los tres blobs; que misma entrada y mismo motor dan `VERDE 1/1` con
`0.00σ`; que otra entrada da `VARA DE OTRA ENTRADA` e `INCOMPARABLE` y **no** da
roja; que un blob tocado da `VARA DE OTRO MOTOR`; que una celda sin vara entra en
el veredicto; y que las 84 celdas vivas no traen `unit` pero sus volcados de
origen dicen `100`.

---

## §E · E-23 · La voz de las capas

Sellado por el rector: **agrupar y sumar**. `componeCapas` suma por ganador antes
de componer y conserva el orden de primera aparición, que es el orden en que el
pozo se reparte.

> antes: «El pozo se partió: IA 2 se lleva 200. IA 2 se lleva 300.»
> ahora: «El pozo se partió: IA 2 se lleva 500.»

Cuántas capas fueron es mecánica del reparto. Lo que esa frase existe para
explicar es por qué el saldo sube menos de lo que promete el resultado, y para eso
lo que importa es cuánto y a quién.

**Por qué el repetido siempre es consecutivo, y por qué salta en cuanto hay tres
capas:** las capas van de abajo arriba y sus elegibles sólo se estrechan, así que
quien gana una gana también la siguiente mientras siga siendo elegible. Con dos
capas el caso casi no se ve; con tres —tres niveles de all-in— sale solo, y 1e-iii
los hizo mucho más frecuentes.

Dos pruebas nuevas en `testMesaAPU1`: dos capas del mismo asiento se dicen una vez
con la suma (400 + 600 → «IA 1 se lleva 1000»), y dos capas de asientos distintos
se siguen diciendo por separado. Sin tocar CSS ni motor.

---

## §F · Veredicto y propuesta

**La frase de cierre es la del Paso 2 de la ficha: la corrida de §D.6 no era
comparable.** No hay deriva, no hay archivo culpable y no hay tanda culpable. Hay
una vara que compara por una clave incompleta y una corrida que no pasó la
bandera que la clave no exigía.

Lo que queda del §D.6 del informe de 1e, corregido:

| lo que decía §D.6 | lo que mide 1e-iv |
|---|---|
| `pasivo` a −26σ, y es determinista | verde en sus 8 celdas, la peor a +1,28σ |
| `aleatorio` rojo en las 16 celdas | rojo en 3, todas de la **mesa de dos** |
| las cuatro mesas llevan 5–7σ de deriva anterior | el motor de 1e-ii reproduce la vara **32/32**, con dos ceros exactos |
| la huella de 1e-iii es la mesa 2 (E-21) | **confirmado**, y ahora es lo único que queda |
| hipótesis: el reparto por capas de 1d | **descartada**: no hay nada que explicar |

**Propuesta, en tres puntos:**

1. **No re-sellar nada. Corregir la ficha de corrida.** La vara `APU1-1c2` es buena
   y se queda como está. Lo que hay que fijar es **cómo se corre**: `--unit 100`,
   `--seed 11` a n=5.000 y `--seed 23` a n=100.000, y una celda de la vara se
   reproduce corriendo **la misma lista de mesas y conductores** con que se selló.
   El lector ya no deja equivocarse en lo primero; lo segundo es E-27 y es del que
   escribe el comando.
2. **Back-fill de procedencia, sin re-sellar** (pide tu palabra). Añadir a las 84
   celdas el `unit: 100` y la `siembra` que sus volcados ya dicen, y a la vara los
   tres blobs del árbol de 1c-2 **si se pueden establecer** — no hay commit de ese
   árbol, así que es probable que no. Ninguna cifra medida se toca. Sin esto, la
   protección de E-24 depende de que `capturas-dsk/` siga en disco.
3. **Las tres celdas de mesa 2 con el conductor al azar: re-sellar con nota.** Son
   un cambio deliberado y medido: E-13 hace que un all-in en heads-up se pague.
   Cuando se autorice, una pasada a `--unit 100`, `--seed 23`, con la nota de E-21
   en la celda. Hasta entonces la vara dice la verdad: ahí el producto cambió.

**1f queda desbloqueada**: el banco vuelve a ser una vara utilizable y ya no hay
un hallazgo abierto que dependa del cerebro de las IAS.

---

## Hallazgos

### E-24 · La clave de una banda no llevaba la apuesta de mesa

Es la causa de todo §D.6. Dos celdas con la misma clave pueden ser dos juegos
distintos si la pila fija de 5.000 fichas se mide contra apuestas distintas: 50
apuestas de profundidad o 100. El banco nunca mintió —el volcado siempre dijo
`configuracion.unit`—, pero la vara no lo guardaba y el lector no lo miraba.

La lección es sobre qué es una clave. Una clave de banda no es un nombre bonito:
es **la lista completa de las cosas que tienen que coincidir para que dos números
se puedan restar**. Si falta una, el que corre tiene que acordarse — y acordarse
no es un mecanismo. Arreglado en §D.

### E-25 · Una vara sin procedencia no se puede declarar caducada

`scripts/apu1_bandas.json` no registra un solo blob, y `commitOrigen` es `null`.
Con eso, la pregunta razonable del rector —«¿las celdas rojas son de otro
motor?»— no tiene respuesta posible desde la vara: no es que la respuesta sea
«no», es que **no hay con qué contestarla**.

Se resolvió por otro camino (la reproducción con siembra), pero el agujero es
real y es del tipo que sólo se ve cuando se necesita. Desde 1e-iv toda vara nueva
nace con la huella de los tres archivos que el banco mide. La vieja no se puede
arreglar sin tocarla, y tocarla es decisión del rector (§F.2).

### E-26 · Una cuenta que no entra en el veredicto no sirve de nada

D-16 de 1b puso la cuenta de celdas comparadas justamente para que nadie
confundiera «verde» con «no medido». La cuenta estaba, y E-20 pasó igual: se
imprimía **al lado** del veredicto, no **dentro**. Ocho celdas sin vara y un
`VERDE` grande arriba se leen como una tabla verde.

La corrección no es más información, es menos: **una sola línea de cierre** que
reparte las celdas en cubos que no se pueden sumar entre sí, y que empieza por
`INCOMPARABLE` en cuanto uno de los cubos malos no está vacío. Un dato que hay
que cruzar con otro para no equivocarse acabará no cruzándose.

### E-27 · `--seed` no alcanza al conductor `aleatorio`, ni a la forma de la matriz

Dos límites de la siembra, los dos consignados y **ninguno arreglado**, porque
arreglarlos cambiaría los dados de celdas ya selladas:

- **`j0Aleatorio` tira con `Math.random`**, y la siembra sólo alimenta
  `deck.setRng` y `aiPlayer.setRng`. Sus 36 celdas **no son reproducibles ni con
  semilla**: cinco corridas de la misma con la misma siembra dieron −5,02, −5,41,
  −5,18, −5,24, −5,05. `espejo`, `pasivo` y `manoso` sí lo son —de ahí los 0,00σ
  del A/B—.
- **La corriente de azar es única para toda la matriz.** La misma celda con la
  misma semilla da distinto según qué mesas y conductores la acompañen: es lo que
  hizo aparecer y desaparecer la roja de mesa 4 pro mañoso. Las 84 celdas de la
  vara se sellaron **una por volcado**, así que reproducir una exige repetir esa
  forma.

El volcado afirmaba «repetible byte a byte». Se corrige el texto en el propio
`limiteConocido`, que es donde lo va a leer el siguiente.

### Correcciones a los hallazgos de 1e

- **E-19 queda a medias.** Su veredicto —«deriva real de 5 a 7σ en las cuatro
  mesas»— **es falso**: se midió a la entrada equivocada. Lo que sí sobrevive es el
  método y media conclusión: la celda de mesa 2 en avanzado a n=5.000 **sí** tiene
  el efecto apoyado en el listón (−4,5σ contra un umbral de 3,93σ) y **sí** oscila
  por eso; subir a n=100.000 la fija, y la fija en rojo. El diagnóstico de E-17
  («banda infrapotenciada») era el correcto para esa celda; lo que E-19 hizo fue
  generalizarlo a dieciséis celdas que no lo eran.
- **E-20 se mantiene, sin la cifra.** Es verdad que `pasivo` no tiene celda a
  n=5.000 y que STOP-2 leyó `SIN BANDA SELLADA` como verde; la lección —«en una
  tabla de veredictos, la fila que no dice ni verde ni rojo es la que hay que leer
  primero»— es la que ha dado E-26. Lo que se cae es el «−26,17σ»: donde sí tiene
  vara, `pasivo` está verde.
- **E-21 se confirma y se refuerza.** Era el único hallazgo de §D.6 que medía algo
  real. La huella de 1e-iii en el banco es el conductor al azar en la mesa de dos,
  y sólo eso, con el resto de la vara ahora verde alrededor.
- **E-23 arreglado** (§E).

---

## Varas

| vara | antes (STOP-3) | ahora |
|---|---|---|
| `vitest` | 933/933 en 32 archivos | **942/942 en 33** (+2 de E-23, +7 del lector) |
| `eslint` | 21 (20 errores, 1 aviso) | **21**, Δ = 0, los mismos uno a uno |
| `build` | ✓ | **✓**, 237 ms |
| protegidos | 6 | **los 6 al mismo blob**: `21c4d3f56318` · `8cfc3736cba2` · `eb61426083ca` · `0d1bb8ea66a8` · `3ce6383eec0d` · `1e21371c8543` |
| `scripts/apu1_bandas.json` | `??`, sin tocar | **`??`, sin tocar** (`md5 65aae3fe…`) |
| git | `f9ee503`, sin commits | **`f9ee503`, sin commits** |

Tocado en esta tanda: `src/hooks/cronicaCore.js` (E-23), `scripts/bancoNiveles.mjs`
(§D), `scripts/testMesaAPU1.test.js` (+2), `scripts/testBancoBandas.test.js`
(nuevo) y este informe. `src/` sólo en E-23, como mandaba la regla 1.

Evidencia de las corridas: `capturas-dsk/_1eiv/` (34 volcados).

**No se ha corrido el arnés.** E-23 cambia una cadena que produce una función pura
ya cubierta por las dos pruebas nuevas, y la ficha no lo pedía; si el rector quiere
la captura de la frase agrupada, `diagDSK apu` con el servidor levantado la da.
