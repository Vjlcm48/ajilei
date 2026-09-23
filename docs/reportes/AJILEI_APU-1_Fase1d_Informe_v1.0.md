# AJILEI · APU-1 · Fase 1d — Informe · v1.0

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Fase:** 1d — Calibración por simulación y encendido de Básico
**Ficha:** `AJILEI_APU-1_Fase1d_v1.0.md` · **Normativo:** `docs/AJILEI_APU-1_Reglas_v1.0.md`
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Fecha:** 2026-09-17
**Estado:** **STOP-2** — barridos hechos y propuesta escrita, **sin aplicar**. §F y §H pendientes.

---

## §A · Línea base

Punto de partida: `main` en `f9ee503` + 1a + 1b + 1c sin commitear (779 pruebas,
lint 21). La ficha 1d abre dos líneas de archivo protegido y todo lo demás vive
en archivos libres.

| Vara | Antes de 1d | Tras el paso 0 |
|---|---|---|
| `npx vitest run` | 30 archivos, 779 | 30 archivos, **783** (779 + 3 de la ficha + 1 consignada en D-11), también al cerrar 1d-ii |
| `npm run lint` | 21 problemas | **21** (Δ = 0), también al cerrar 1d-ii |
| `src/engine/gameEngine.js` | `110648bd01b9` | **`e4fa160a0acf`** |
| `src/engine/deck.js` | `bfb44c03786c` | **`eb61426083ca`** |
| `src/engine/aiPlayer.js` | `5838277325b3` | **`5838277325b3`** — INTACTO (§1.2: no se abre) |
| `src/config/ajileiConfig.js` | `cf1870597fa9` | **`cf1870597fa9`** — INTACTO (§E no se aplica) |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | **`0d1bb8ea66a8`** — INTACTO |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | **`3ce6383eec0d`** — INTACTO |
| `src/styles/gameTable.css` | `1e21371c8543` | **`1e21371c8543`** — INTACTO |

Sin commits. Sin `npm install`. Sin pantalla, hooks, textos, `supabase/` ni sonda.

---

## §B · El paso 0 (tanda 1d-i)

### B.1 · Las dos correcciones de motor

| Archivo | Rango | Qué |
|---|---|---|
| `gameEngine.js` · `startHand` | el cobro del ante | **D-7.** `const chips = p.chips - unit; return { …, chips, allIn: chips === 0 }`. Un asiento que paga justo el ante queda en all-in desde el reparto: no recibe turno, no crea deuda y su capa es exactamente su ante. |
| `gameEngine.js` · `startHand` | el `return` | **Segunda línea de D-7, fuera del rango literal de la ficha.** `activePlayerIndex: primerTurno(players, newManoIndex)`. Ver **D-11**. |
| `deck.js` | el ligado del generador | `const AZAR_POR_DEFECTO = () => Math.random(); let rng = AZAR_POR_DEFECTO`, y `setRng`/`resetRng` contra esa constante. Mismo algoritmo, mismo número de llamadas, mismo orden. |

Nada más se tocó en los dos archivos protegidos abiertos. `aiPlayer.js` no se abrió.

### B.2 · `scripts/bancoNiveles.mjs` (el diff completo contra `main` al cerrar 1d-ii es **+788 −38**, de los cuales +97 −19 ya eran de 1c)

| Pieza | Qué |
|---|---|
| **Espejo simétrico (D-8)** | Bajo `espejo` el asiento 0 se **crea** con `isHuman: false` (`nuevaPartida`), así que se presenta como IA para todas las reglas: la elección de faroleadora de §6.4 y la lectura de descartes de ② (`aiPlayer.js:817`), que consultan el mismo campo. `estadoEspejo` **no se toca**: la permutación siempre fue correcta; lo torcido era el jugador que permutaba. Bajo `pasivo`, `aleatorio` y `manoso` el asiento 0 sigue siendo el humano. |
| **`--sinReloj`** | Omite `generado`, `ms` y `manosPorMinuto`. Con la misma semilla dos corridas dan archivos idénticos al byte. |
| **`--param ruta=valor`** (repetible) | Sobreescribe `AJILEI_CONFIG` en memoria por ruta con puntos. `null`/`true`/`false` y números se leen como tales. El volcado registra `paramsAplicados`. |
| **`--barrido spec.json`** | Corre una lista de celdas `{nombre, params, mesa, j0, nivel, manos}` y escribe un solo JSON. Entre celdas restaura la configuración prístina, reaplica los `--param` globales y **re-siembra**: números aleatorios comunes, para que la diferencia entre dos celdas mida el parámetro y no el reparto. |
| **`--varas a,b,c`** | Junta volcados y evalúa V1–V7 sin re-simular. V3 y V7 comparan los tres retos y una corrida lleva uno solo. |
| **Conductor `manoso`** (alias `mañoso`) | La transcripción de la maña de Victor, con `FUERTE_MANOSO = {2:40, 3:38, 4:36, 5:34}` y `PAGA_MANOSO = 30` **fijos y a la vista en el archivo**, no calibrables. Entra en la matriz por defecto. |
| **Métricas nuevas** por celda | `partidasCompletas`, `duracionPartida {mediana, p10, p90}`, `victoriasJ0`, `farolesIA`, `allInPorAsiento`, `subidasIA {x1,x2,x5,x10}`, `quiebrasPorMano`. Todas las celdas arrancan con **5.000 en todos los asientos** por lista explícita, para que ningún `--param` de un barrido pueda mover la pila sin que nadie se entere. |
| **Fin de partida** | «Partida» = desde `createInitialState` hasta que el asiento 0 quiebra **o** quedan ≤1 vivos. Antes sólo cortaba por lo segundo. La estadística de manos **contadas** no se mueve —sólo cuentan las manos de mesa llena, y ésas ocurren todas antes de la primera eliminación—; lo que cambia es que `duracionPartida` pasa a medir lo que preguntan V1, V2 y V7. |

### B.3 · El farol observable

`aiPlayer.js` no se abre, así que el banco no puede sellar el farol de §6.4 desde
dentro (`_DIAG_PRO.farolPorAsiento` sólo lo escribe el farol con lectura de Pro,
la capacidad ⑥). Se mide **desde fuera**, comparando estados, con dos listones
fijos de la maña de Victor —nunca los que 1d barre, porque un listón que se
moviera con el parámetro barrido haría V4 incomparable entre celdas—:

- **farol DURO** · subida en `BET_2`/`BET_3` con puntaje **< 30**: la mano con la
  que ni la maña pagaría. **Es la vara de V4.**
- **farol ANCHO** · puntaje **< `FUERTE_MANOSO[mesa]`**: «subió sin la mano que
  justifica subir», que incluye la agresión con mano mediana.
- **conMano** · el resto, de contraste: si la dura y la ancha se parecieran, la
  IA no estaría distinguiendo farol de valor.

Uno por asiento y por mano: el farol es un suceso de la mano, no de cada subida.

### B.4 · Las cuatro comprobaciones de STOP-1

**1 · Espejo de mesa 2, `--seed 11 --manos 50000`, los tres retos.** La puerta (b)
vuelve a VERDE y la asimetría de D-8 desaparece:

| Reto | Antes (informe 1c) | Ahora | σ | b1 vs 1/N | b2 gemelos |
|---|---|---|---|---|---|
| `basico` | — | **49,94 %** ±0,23 | 0,25σ | VERDE | VERDE (−0,12 pp, 0,36σ) |
| `avanzado` | 48,16 % (**5,03σ**) | **49,62 %** ±0,27 | **1,43σ** | VERDE | VERDE (−0,77 pp, 2,02σ) |
| `pro` | 46,56 % (**10,02σ**) | **49,86 %** ±0,30 | **0,46σ** | VERDE | VERDE (−0,28 pp, 0,65σ) |

**2 · `diff` vacío.** Dos corridas `--mesa 3 --j0 espejo --manos 5000 --seed 23
--sinReloj --nivel pro` producen archivos idénticos. Sin `--sinReloj` sólo
difieren `generado`, `ms` y `manosPorMinuto`.

**3 · Lectores en vivo (regla 1.3).** `--param ia.farol.bloquePorReto.pro=4`
sobre mesa 4 Pro, 20.000 manos, semilla 23: los faroles duros pasan de **75.614 a
93.056** (+23 %) y `paramsAplicados` lo registra. **Ninguno de los ocho lectores
de `aiPlayer.js` cachea**: `aiPlayer.js` no hace falta abrirlo.

**4 · Varas de suite.** `npx vitest run` 30 archivos, **783 pruebas, 0 fallos**.
`npm run lint` **21 problemas** (Δ = 0).

---

### B.5 · Lo que 1d-ii añadió al banco (archivo libre)

| Pieza | Qué | Por qué |
|---|---|---|
| `--manosoDelta <n>` | Baja n puntos el listón con el que el **conductor** decide subir. Por defecto 0. | La tabla de sensibilidad del punto 3 de la orden. **Ni el archivo, ni `PAGA_MANOSO`, ni los dos listones del farol observable se mueven**: los umbrales del `mañoso` siguen siendo `{2:40, 3:38, 4:36, 5:34}` y el farol sigue siendo comparable entre celdas. |
| Histograma de puntaje | `farolesIA.porPuntaje`: por cada bin de 2 puntos del puntaje que respaldaba la subida, cuántas se pagaron y cuántas se perdieron. | V4 decía que los faroles pierden demasiado; esto dice **dónde está el corte**. Es lo que fija el piso de R-A con datos y no con corazonada. |
| `unit` por celda en `--barrido` | La apuesta de mesa deja de ser una constante de la corrida. | El diagnóstico de profundidad de D.10. La pila inicial **no** se toca: sigue siendo 5.000 en todos los asientos, como manda la ficha §5. |
| V1 con el rango corregido | `RANGOS.V1 = { victorias: [0.60, 0.70], mediana: [8, 20], p10Max: 6 }` | Corrección del rector al abrir 1d-ii: los 5–6 manos de Victor son récords, no la partida típica. El p10 recoge el récord. |

Los cuatro son de `scripts/bancoNiveles.mjs`, archivo libre. **`aiPlayer.js` sigue
sin abrirse** y `ajileiConfig.js` sigue en `cf1870597fa9`, byte a byte como estaba.

Las 796 celdas quedan en `capturas-dsk/_barridos1d/` con sus especificaciones y
sus volcados: `t00..t15` la primera ronda (496), `r2/` la segunda (148), `r3/` la
tercera (88) y `r4/` la cuarta (64). Todas con `--seed 23 --sinReloj`, así que
cualquiera las reproduce al byte.

---

## §C · Las siete varas con la configuración de 1c, antes de tocar nada

Matriz completa (4 mesas × 4 conductores × 3 retos = 48 celdas), `--manos 30000
--seed 11 --sinReloj`. Conservación, pasajero y espejo: **VERDE en los tres
retos**. Ésta es la foto de dónde está el juego hoy.

### V1 — `mañoso` vs 1 IA Básico, mesa 2 · **FUERA**

| | Medido | Rango |
|---|---|---|
| victorias del `mañoso` | **90,43 %** (115 partidas) | 60–70 % |
| mediana de manos | **216** (p10 81 · p90 481) | 5–12 |

### V2 — `mañoso` vs 4 IAS, mesa 5 · **FUERA en los tres retos**

| Reto | Mediana | p10 | p90 | Partidas (por quiebra del j0) | Rango: mediana 10–25, p10 ≥ 4 |
|---|---|---|---|---|---|
| `basico` | **191** | 15 | 496 | 1.435 (296) | FUERA |
| `avanzado` | **37** | **3** | 145 | 8.293 (2.498) | FUERA |
| `pro` | **41** | **3** | 171 | 6.924 (2.267) | FUERA |

### V3 — la escalera ordena · **EN RANGO en las cuatro mesas**

| Mesa | Básico | Avanzado | Pro | Caída | Rango: decreciente y ≥10 pp |
|---|---|---|---|---|---|
| 2 | 90,43 % | 81,73 % | 38,64 % | **51,80 pp** | EN RANGO |
| 3 | 95,62 % | 72,20 % | 57,74 % | **37,88 pp** | EN RANGO |
| 4 | 86,14 % | 47,66 % | 45,54 % | **40,61 pp** | EN RANGO |
| 5 | 78,19 % | 43,83 % | 41,98 % | **36,20 pp** | EN RANGO |

### V4 y V4b — los faroles · **FUERA** (la única celda `espejo` en rango es mesa 2 Básico)

Lectura `espejo` (IA contra IA), que es la honesta: el conductor no distorsiona
quién paga. Rango de V4: 40–55 % de pérdida entre los faroles **pagados**.

| Mesa · reto | Farol duro / mano | Pagados | **Pierde** | V4b puntaje medio | Ancho (pierde) | conMano (pierde) |
|---|---|---|---|---|---|---|
| 2 · básico | 0,161 | 4.345 | **46,26 %** | 26,04 | 27,62 % | 5,16 % |
| 3 · básico | 0,141 | 15.508 | 54,34 % | 26,22 | 31,64 % | 7,95 % |
| 4 · básico | 0,130 | 52.073 | 54,78 % | 26,62 | 34,78 % | 13,63 % |
| 5 · básico | 0,093 | 99.710 | **60,16 %** | 26,65 | 37,14 % | 13,64 % |
| 2 · avanzado | 0,154 | 3.201 | 50,30 % | 23,47 | 28,03 % | 7,30 % |
| 3 · avanzado | 0,226 | 16.057 | **57,07 %** | 24,08 | 35,90 % | 10,93 % |
| 4 · avanzado | 0,213 | 27.180 | **56,83 %** | 24,06 | 43,98 % | 20,96 % |
| 5 · avanzado | 0,203 | 34.282 | **55,56 %** | 24,14 | 44,19 % | 27,75 % |
| 2 · pro | 0,418 | 9.323 | **63,26 %** | 22,91 | 41,07 % | 10,05 % |
| 3 · pro | 0,413 | 33.479 | **60,64 %** | 23,28 | 41,08 % | 13,67 % |
| 4 · pro | 0,366 | 38.968 | **58,74 %** | 23,29 | 47,09 % | 25,59 % |
| 5 · pro | 0,337 | 49.350 | **56,21 %** | 23,33 | 46,79 % | 31,72 % |

La IA **sí** distingue farol de valor —26,71 % de pérdida con mano contra 58,27 %
sin ella en mesa 4 Pro— pero farolea con cartas demasiado flojas: el puntaje
medio del farol duro cae de 26,6 en Básico a **22,9 en Pro**, y la pérdida sube
con él. Es exactamente lo que Victor señaló: «farolear con 21 no va».

### V5 — all-in forzados y multiplicadores (sólo reporte)

| Mesa · reto | all-in / mano | ...de ellos ganados | ×1 | ×2 | ×5 | ×10 | Quiebras / mano |
|---|---|---|---|---|---|---|---|
| 2 · básico | 0,0009 | 55,6 % | **100 %** | 0 | 0 | 0 | 0,00 % |
| 5 · básico | 0,0006 | 37,3 % | **100 %** | 0 | 0 | 0 | 0,04 % |
| 2 · avanzado | 0,0109 | 31,0 % | 78,3 % | 0,1 % | 0,1 % | **21,5 %** | 0,00 % |
| 4 · avanzado | 0,1032 | 21,0 % | 41,4 % | 0,9 % | 1,3 % | **56,4 %** | 3,84 % |
| 5 · avanzado | **0,2076** | 21,2 % | 23,6 % | 1,8 % | 2,2 % | **72,4 %** | **9,24 %** |
| 4 · pro | 0,1101 | 19,9 % | 38,1 % | 0,8 % | 1,2 % | **59,9 %** | 3,81 % |
| 5 · pro | **0,2031** | 19,4 % | 23,3 % | 1,4 % | 1,9 % | **73,4 %** | **8,64 %** |

Básico no usa el multiplicador ni una sola vez —es lo que «Básico neutro»
significa— y casi nunca llega al all-in. Avanzado y Pro en mesa 5 empujan la pila
una de cada cinco manos y **tres de cada cuatro subidas son ×10**: ése es el
motor de D-9, y el par que §3.3 manda cruzar.

### V6 — el umbral de subida fuerte contra el piso de `raiseMin` · **FUERA**

Aritmética sobre la configuración, sin simular una mano. AGRESIVA `raiseMin` 28,
`opponentAdj` = 2·(rivales−1), desplazamiento AGRESIVA −2.

| Mesa | Umbral §6.3 desplazado | Piso `raiseMin + opponentAdj` | Banda para el ×1 | |
|---|---|---|---|---|
| 2 | 39 | 30 | **+9** | EN RANGO |
| 3 | 38 | 32 | **+6** | EN RANGO |
| 4 | 34 | 34 | **0** | **FUERA** |
| 5 | 31 | 36 | **−5** | **FUERA** |

Es **D-5 medido**: en mesas 4 y 5 la franja donde la IA subiría ×1 está vacía o
invertida, así que la subida ×1 no existe y la regla de §6.3 no decide nada.
Coincide con V5: en mesa 5 el 72–73 % de las subidas son ×10.

### V7 — IA contra IA (espejo), mesa 5, mediana ≥ 12 manos · **FUERA por Avanzado**

| Reto | Mediana | p10 | p90 | Partidas | |
|---|---|---|---|---|---|
| `basico` | **1.196** | 75 | 17.058 | 292 | EN RANGO (por exceso: Básico casi no apuesta) |
| `avanzado` | **11** | 2 | 74 | 9.175 | **FUERA por una mano** |
| `pro` | **12** | 2 | 76 | 7.307 | EN RANGO, al filo |

Las IAS se liquidan entre sí en 11–12 manos mientras el `mañoso` tarda 37–41
contra las mismas mesas: **la mesa se liquida más rápido de lo que un humano
hábil la liquida**, que es justo lo que V7 existe para impedir.



---

## §D · Los barridos (tanda 1d-ii)

**Método.** **796 celdas** en cuatro rondas —496 los barridos del §3.2 y el cruce
del §3.3, 148 el histograma del farol y el diagnóstico de profundidad, 88 los
mandos de Básico por separado y 64 el umbral propio de Básico—, todas con
`--seed 23`, **100.000 manos** y `--sinReloj`. Entre celdas el banco restaura la
configuración prístina, reaplica los `--param` globales y **vuelve a sembrar**:
números aleatorios comunes, de modo que la diferencia entre dos celdas mide el
parámetro y no el reparto. Nada se aplicó a `ajileiConfig.js`. `aiPlayer.js` no se
abrió.

La ficha estimaba ≈1 s por celda; la realidad son **1,8 s en mesa 2 y 31 s en
mesa 5**, así que las 796 celdas se repartieron en 16 procesos paralelos
(**D-14**).

### D.0 · La línea base a 100.000 manos y semilla 23

§C se midió con 30.000 manos y semilla 11. Todo §D se compara contra esta base,
que es la misma configuración con la muestra de los barridos.

| Mesa | Conductor | Básico | Avanzado | Pro | | |
|---|---|---|---|---|---|---|
| | | victorias · mediana | victorias · mediana | victorias · mediana | V3 caída | V6 banda |
| 2 | `manoso` | 92,20 % · 202 | 72,33 % · 218 | 47,30 % · 230 | **44,90 pp** | +9 |
| 3 | `manoso` | 94,52 % · 188 | 72,35 % · 177 | 57,05 % · 195 | **37,47 pp** | +6 |
| 4 | `manoso` | 85,10 % · 166 | 47,79 % · 50 | 47,08 % · 55 | **38,02 pp** | **0** |
| 5 | `manoso` | 76,32 % · 186 | 43,60 % · 38 | 42,80 % · 42 | **33,52 pp** | **−5** |
| 2 | `espejo` | 51,06 % · 901 | 52,34 % · 108 | 51,59 % · 80 | — | — |
| 3 | `espejo` | 37,44 % · 1.263 | 33,23 % · 73 | 31,93 % · 69 | — | — |
| 4 | `espejo` | 23,45 % · 1.249 | 24,82 % · 19 | 24,01 % · 21 | — | — |
| 5 | `espejo` | 17,81 % · 996 | **19,99 % · 10** | **19,96 % · 13** | — | V7 |

V1 **FUERA** (92,20 %, mediana 202, p10 58) · V2 **FUERA** (38/42, p10 3) ·
V3 **EN RANGO** en las cuatro mesas · V4 **FUERA** salvo mesa 2 Avanzado y Básico ·
V6 **FUERA** en mesas 4 y 5 · V7 **FUERA por Avanzado** (10 < 12).

Cambia de §C sólo el ruido de la muestra: los veredictos son los mismos.



### D.1 · `subidaFuerte.porMesa` — 112 celdas (mira V2, V6, V7)

**Mesa 2** (base 41 · piso `raiseMin+opponentAdj` = 30)

| `porMesa[2]` | V6 banda | espejo mediana av · pro | mañoso mediana av · pro | V4 espejo av · pro | cumple |
|---|---|---|---|---|---|
| 37 | **+5** **✓** | 37 · 30 | 126 (p10 18) · 160 (p10 27) | 47.85 % · 57.79 % | 1 |
| 39 | **+7** **✓** | 66 · 49 | 175 (p10 41) · 181 (p10 28) | 47.87 % · 59.53 % | 1 |
| 41 ·base | **+9** **✓** | 108 · 80 | 218 (p10 44) · 230 (p10 55) | 49.69 % · 61.69 % | 1 |
| 43 | **+11** **✓** | 173 · 151 | 222 (p10 57) · 274 (p10 92) | 49.08 % · 62.40 % | 1 |
| 45 | **+13** **✓** | 195 · 176 | 243 (p10 79) · 292 (p10 64) | 48.94 % · 61.86 % | 1 |
| 47 | **+15** **✓** | 192 · 197 | 283 (p10 95) · 286 (p10 77) | 50.06 % · 61.30 % | 1 |

**Mesa 3** (base 40 · piso `raiseMin+opponentAdj` = 32)

| `porMesa[3]` | V6 banda | espejo mediana av · pro | mañoso mediana av · pro | V4 espejo av · pro | cumple |
|---|---|---|---|---|---|
| 36 | **+2** **✓** | 24 · 23 | 104 (p10 16) · 123 (p10 17) | 55.16 % · 57.67 % | 1 |
| 38 | **+4** **✓** | 42 · 38 | 134 (p10 18) · 142 (p10 20) | 54.82 % · 58.80 % | 1 |
| 40 ·base | **+6** **✓** | 73 · 69 | 177 (p10 26) · 195 (p10 29) | 58.10 % · 61.53 % | 1 |
| 42 | **+8** **✓** | 158 · 119 | 228 (p10 51) · 247 (p10 36) | 56.95 % · 60.96 % | 1 |
| 44 | **+10** **✓** | 256 · 211 | 244 (p10 60) · 300 (p10 57) | 56.90 % · 60.89 % | 1 |
| 46 | **+12** **✓** | 305 · 254 | 242 (p10 77) · 330 (p10 59) | 57.18 % · 61.39 % | 1 |

**Mesa 4** (base 36 · piso `raiseMin+opponentAdj` = 34)

| `porMesa[4]` | V6 banda | espejo mediana av · pro | mañoso mediana av · pro | V4 espejo av · pro | cumple |
|---|---|---|---|---|---|
| 32 | **-4** ✗ | 9 · 12 | 40 (p10 3) · 44 (p10 4) | 53.87 % · 56.24 % | 0 |
| 34 | **-2** ✗ | 13 · 17 | 45 (p10 4) · 49 (p10 5) | 55.11 % · 56.88 % | 0 |
| 36 ·base | **+0** ✗ | 19 · 21 | 50 (p10 4) · 55 (p10 5) | 57.46 % · 58.54 % | 0 |
| 38 | **+2** **✓** | 29 · 35 | 65 (p10 5) · 69 (p10 6) | 57.26 % · 59.75 % | 1 |
| 40 | **+4** **✓** | 57 · 64 | 93 (p10 7) · 92 (p10 8) | 59.94 % · 62.12 % | 1 |
| 42 | **+6** **✓** | 126 · 118 | 143 (p10 14) · 146 (p10 15) | 58.41 % · 61.01 % | 1 |
| 44 | **+8** **✓** | 238 · 217 | 163 (p10 26) · 179 (p10 28) | 58.20 % · 61.89 % | 1 |
| 46 | **+10** **✓** | 274 · 274 | 168 (p10 35) · 186 (p10 31) | 59.29 % · 62.19 % | 1 |

**Mesa 5** (base 33 · piso `raiseMin+opponentAdj` = 36)

| `porMesa[5]` | V6 banda | V7 espejo av · pro | V2 mañoso av · pro | V4 espejo av · pro | cumple |
|---|---|---|---|---|---|
| 29 | **-9** ✗ | 5 · 6 | 32 (p10 4) · 33 (p10 4) | 50.33 % · 50.90 % | 1 |
| 31 | **-7** ✗ | 7 · 8 | 36 (p10 3) · 37 (p10 3) | 55.36 % · 55.32 % | 0 |
| 33 ·base | **-5** ✗ | 10 · 13 | 38 (p10 3) · 42 (p10 3) | 55.60 % · 56.37 % | 0 |
| 35 | **-3** ✗ | 14 · 16 | 39 (p10 3) · 44 (p10 4) | 56.41 % · 56.94 % | 1 |
| 37 | **-1** ✗ | 19 · 22 | 45 (p10 4) · 49 (p10 4) | 58.45 % · 59.10 % | 1 |
| 39 | **+1** **✓** | 34 · 41 | 59 (p10 4) · 62 (p10 5) | 58.87 % · 61.11 % | 2 |
| 41 | **+3** **✓** | 70 · 80 | 90 (p10 6) · 93 (p10 7) | 59.68 % · 62.34 % | 2 |
| 43 | **+5** **✓** | 140 · 148 | 156 (p10 14) · 153 (p10 12) | 59.68 % · 62.54 % | 2 |

### D.2 · `fraccionPozo` — 40 celdas (mira V1, V2, V7)

| `fraccionPozo` | reto | V7 espejo m5 | V2 mañoso m5 | V4 espejo m2 | V4 espejo m5 |
|---|---|---|---|---|---|
| 0.15 | avanzado | 12 **✓** | 37 (p10 3) | 50.11 % | 55.81 % |
| 0.2 | avanzado | 10 ✗ | 37 (p10 3) | 49.71 % | 55.65 % |
| 0.25 ·base | avanzado | 10 ✗ | 38 (p10 3) | 49.69 % | 55.60 % |
| 0.33 | avanzado | 9 ✗ | 37 (p10 3) | 48.14 % | 55.01 % |
| 0.4 | avanzado | 6 ✗ | 38 (p10 3) | 47.45 % | 52.23 % |
| 0.15 | pro | 14 **✓** | 41 (p10 3) | 63.61 % | 57.55 % |
| 0.2 | pro | 13 **✓** | 42 (p10 3) | 62.39 % | 56.64 % |
| 0.25 ·base | pro | 13 **✓** | 42 (p10 3) | 61.69 % | 56.37 % |
| 0.33 | pro | 11 ✗ | 42 (p10 3) | 60.82 % | 56.27 % |
| 0.4 | pro | 7 ✗ | 43 (p10 3) | 53.67 % | 52.30 % |

### D.3 · `allIn.puntajeMin` — 40 celdas (mira V2, V5, V7)

| `puntajeMin` | reto | V7 espejo m5 | V2 mañoso m5 | V4 espejo m5 |
|---|---|---|---|---|
| 27 | avanzado | 10 | 37 (p10 3) | 55.76 % |
| 29 | avanzado | 10 | 37 (p10 3) | 55.46 % |
| 31 ·base | avanzado | 10 | 38 (p10 3) | 55.60 % |
| 33 | avanzado | 10 | 38 (p10 3) | 55.62 % |
| 35 | avanzado | 10 | 37 (p10 3) | 55.70 % |
| 27 | pro | 12 | 41 (p10 3) | 56.45 % |
| 29 | pro | 12 | 41 (p10 3) | 56.60 % |
| 31 ·base | pro | 13 | 42 (p10 3) | 56.37 % |
| 33 | pro | 12 | 43 (p10 3) | 56.46 % |
| 35 | pro | 12 | 41 (p10 3) | 56.45 % |

### D.4 · `farol.bloquePorReto` — 48 celdas (mira V4, V4b, V7)

Lectura `espejo`, que es la honesta. **V4 = 40–55 %.**

| reto | bloque | V4 mesa 2 | mesa 3 | mesa 4 | mesa 5 | V4b puntaje medio | cumple |
|---|---|---|---|---|---|---|---|
| basico | 12 | 50.18 % | 58.27 % | 60.59 % | 61.74 % | 24.11 | 1/4 |
| basico | 15 | 49.22 % | 56.68 % | 59.23 % | 61.26 % | 24.31 | 1/4 |
| basico | 20 | 49.74 % | 55.83 % | 59.51 % | 61.78 % | 24.75 | 1/4 |
| basico | 25 | 48.23 % | 57.31 % | 58.71 % | 60.20 % | 25.00 | 1/4 |
| avanzado | 8 | 49.12 % | 58.17 % | 55.97 % | 53.91 % | 23.63 | 2/4 |
| avanzado | 10 | 49.79 % | 57.74 % | 57.05 % | 54.89 % | 23.91 | 2/4 |
| avanzado | 12 ·base | 49.69 % | 58.10 % | 57.46 % | 55.60 % | 24.13 | 1/4 |
| avanzado | 15 | 49.73 % | 57.22 % | 57.64 % | 56.58 % | 24.39 | 1/4 |
| pro | 5 | 61.56 % | 60.83 % | 56.29 % | 53.78 % | 22.90 | 1/4 |
| pro | 6 | 62.59 % | 61.47 % | 57.35 % | 54.93 % | 23.07 | 1/4 |
| pro | 8 ·base | 61.69 % | 61.53 % | 58.54 % | 56.37 % | 23.31 | 0/4 |
| pro | 10 | 63.08 % | 61.89 % | 58.99 % | 57.26 % | 23.47 | 0/4 |

### D.5 · `pasarConManoGrande` — 16 celdas (mira V1, V3)

| reto | valor | mañoso m2 victorias · mediana | mañoso m5 victorias · mediana |
|---|---|---|---|
| basico | 0 ·base | 92.20 % · 202 | 76.32 % · 186 |
| basico | 0.1 | 92.20 % · 202 | 76.32 % · 186 |
| avanzado | 0.1 | 75.65 % · 213 | 44.26 % · 38 |
| avanzado | 0.15 ·base | 72.33 % · 218 | 43.60 % · 38 |
| avanzado | 0.25 | 74.87 % · 213 | 43.22 % · 36 |
| pro | 0.15 | 44.55 % · 231 | 42.88 % · 42 |
| pro | 0.25 ·base | 47.30 % · 230 | 42.80 % · 42 |
| pro | 0.35 | 47.98 % · 231 | 42.16 % · 39 |

### D.6 · `desplazamiento` — 24 celdas (mira V3, V7)

| amplitud | V6 m2 · m5 | V7 espejo m5 av · pro | mañoso m2 av · pro | mañoso m5 av · pro |
|---|---|---|---|---|
| ±1 | +10 · -4 | 11 · 13 | 72.33 % · 43.07 % | 43.27 % · 41.66 % |
| ±2 ·base | +9 · -5 | 10 · 13 | 72.33 % · 47.30 % | 43.60 % · 42.80 % |
| ±3 | +8 · -6 | 10 · 12 | 75.19 % · 49.50 % | 44.39 % · 43.32 % |



**Lectura de D.1.** `porMesa` es el mando de la duración: sube el umbral y las
partidas se alargan en todas las mesas y los dos conductores, monótonamente.
Con eso **V6 y V7 se arreglan** —mesa 4 recupera la banda del ×1 en **38** (+2) y
mesa 5 en **39** (+1); V7 pasa de 12 manos en mesa 5 desde **35** (14/16)— pero
**V2 se aleja**: la mediana del `mañoso` en mesa 5 va de 38 a 59 en `porMesa[5]=39`
y a 156 en 43. V2 y V7 tiran del mismo mando en sentidos opuestos, y el cruce de
§3.3 confirma que `fraccionPozo` no los separa.

**Lectura de D.2.** `fraccionPozo` mueve poco y siempre en la misma dirección:
más fracción = pagos más baratos = partidas **más cortas** (V7 mesa 5 Avanzado
pasa de 12 con 0,15 a 6 con 0,40). En cambio **es el único mando que mejora V4**:
en mesa 2 Pro la pérdida del farol duro baja de 61,69 % con 0,25 a **53,67 % con
0,40** —dentro de rango por primera vez— y en mesa 5 de 56,37 a 52,23 %. La razón
es de aritmética: con la fracción alta se pagan manos que antes se retiraban, el
denominador crece con pagos que el faroleador gana, y la tasa baja. V2 no se
mueve (37–38 en todo el barrido).

**Lectura de D.3.** `allIn.puntajeMin` **no mueve ninguna vara**: entre 27 y 35 la
mediana del espejo de mesa 5 va de 10 a 12 y la del `mañoso` de 37 a 43, todo
dentro del ruido. Es coherente con §6.6: el all-in por puntaje es la rama
minoritaria; la que decide es la fracción del pozo. **Se deja en 31.**

**Lectura de D.4.** El tamaño del bloque **no arregla V4**. En mesas 3, 4 y 5 la
pérdida del farol duro se queda entre 53,8 y 62 % con todos los tamaños, y en
mesa 2 sólo entran Básico y Avanzado —que ya entraban—. **Pro no entra en rango
con ningún tamaño en ninguna mesa**, y el bloque más pequeño (5) es el que menos
pierde (61,56 % en mesa 2), o sea que la dirección del mando ni siquiera es la
que haría falta. El bloque decide **cuándo** se farolea; V4 pregunta **con qué**.
Es exactamente el supuesto que la orden del rector previó: §E propone la regla
nueva.

**Lectura de D.5.** `pasarConManoGrande.basico` da resultados **idénticos al
byte** en 0 y 0,10. No es un error del barrido: `aiPlayer.js:1162` tira ese dado
**dentro** de la rama `umbralFuerte !== null && enApuestaAlta && scoreEf >=
umbralFuerte`, y `umbralFuerte` es `null` mientras `subidaFuerte.porReto.basico`
sea `false`. El mando está **inerte** en Básico hasta que Básico se encienda
(**D-15**). Se vuelve a barrer con la regla encendida en D.9. En Avanzado y Pro
mueve ±3 pp de victorias del `mañoso` en mesa 2 y nada en mesa 5.

**Lectura de D.6.** La amplitud del desplazamiento mueve V6 punto a punto (es
aritmética) y **nada más**: V7 en mesa 5 va de 11 a 10, y las victorias del
`mañoso` se mueven dentro del ruido. El mando es de temperamento, no de
calibración. **Se deja en ±2.**




### D.7 · Cruce obligatorio §3.3 — `porMesa` × `fraccionPozo`, Avanzado, 100 celdas

**Mesa 2** — celda = mediana del `espejo` / mediana del `mañoso` (p10) / V4 del `espejo`

| `porMesa[2]` \ `fraccionPozo` | 0.15 | 0.2 | 0.25 | 0.33 | 0.4 | V6 |
|---|---|---|---|---|---|---|
| 37 | 42 / 127 (21) / 48 % | 39 / 136 (26) / 48 % | 37 / 126 (18) / 48 % | 37 / 140 (24) / 48 % | 39 / 149 (22) / 47 % | +5 |
| 39 | 62 / 168 (29) / 49 % | 66 / 170 (34) / 48 % | 66 / 175 (41) / 48 % | 66 / 168 (45) / 47 % | 74 / 179 (29) / 46 % | +7 |
| 41 | 103 / 198 (46) / 50 % | 115 / 215 (51) / 50 % | 108 / 218 (44) / 50 % | 110 / 207 (39) / 48 % | 112 / 234 (58) / 47 % | +9 |
| 43 | 138 / 223 (57) / 50 % | 180 / 252 (81) / 50 % | 173 / 222 (57) / 49 % | 192 / 243 (61) / 49 % | 168 / 258 (74) / 46 % | +11 |
| 45 | 183 / 251 (69) / 50 % | 214 / 253 (78) / 49 % | 195 / 243 (79) / 49 % | 216 / 313 (90) / 49 % | 229 / 267 (78) / 49 % | +13 |

**Mesa 5** — celda = mediana del `espejo` / mediana del `mañoso` (p10) / V4 del `espejo`

| `porMesa[5]` \ `fraccionPozo` | 0.15 | 0.2 | 0.25 | 0.33 | 0.4 | V6 |
|---|---|---|---|---|---|---|
| 29 | 6 / 33 (4) / 50 % | 6 / 33 (4) / 50 % | 5 / 32 (4) / 50 % | 5 / 32 (4) / 50 % | 4 / 32 (4) / 50 % | -9 |
| 31 | 8 / 36 (3) / 55 % | 7 / 36 (3) / 55 % | 7 / 36 (3) / 55 % | 6 / 35 (3) / 55 % | 4 / 35 (3) / 52 % | -7 |
| 33 | 12 / 37 (3) / 56 % | 10 / 37 (3) / 56 % | 10 / 38 (3) / 56 % | 9 / 37 (3) / 55 % | 6 / 38 (3) / 52 % | -5 |
| 35 | 16 / 39 (3) / 57 % | 14 / 40 (3) / 56 % | 14 / 39 (3) / 56 % | 12 / 40 (3) / 57 % | 8 / 41 (3) / 53 % | -3 |
| 37 | 22 / 47 (3) / 59 % | 19 / 46 (3) / 59 % | 19 / 45 (4) / 58 % | 17 / 46 (3) / 58 % | 12 / 47 (3) / 54 % | -1 |



### D.8 · Encendido de Básico — 80 + 88 celdas (mira V1, V2, V3)

La ficha pide encender Básico «con `porMesa` propio». **Eso hoy no se puede
escribir:** `aiPlayer.js:84` lee `(cfg.porMesa ?? {})[numPlayers]` — un solo mapa
para los tres retos. Encender `subidaFuerte.porReto.basico` le da a Básico
**exactamente el umbral de Avanzado**, y ahí la escalera se cae:

| Mesa | V3 hoy (Básico apagado) | V3 con `porReto.basico = true` | |
|---|---|---|---|
| 2 | 92,20 → 72,33 → 47,30 · **44,90 pp** | 82,74 → 72,33 → 47,30 · **35,43 pp** | EN RANGO |
| 3 | 94,52 → 72,35 → 57,05 · **37,47 pp** | 78,71 → 72,35 → 57,05 · **21,66 pp** | EN RANGO |
| 4 | 85,10 → 47,79 → 47,08 · **38,02 pp** | 47,92 → 47,79 → 47,08 · **0,84 pp** | **FUERA** |
| 5 | 76,32 → 43,60 → 42,80 · **33,52 pp** | 45,55 → 43,60 → 42,80 · **2,75 pp** | **FUERA** |

Ninguno de los ocho acompañamientos del §3.2 lo salva: con `fraccionPozo`,
`allIn.puntajeMin` o `bloque` encima, la caída de mesa 4 se queda entre 0,84 y
2,33 pp y la de mesa 5 entre 2,13 y 3,41 pp. **Dar a Básico la regla de §6.3 al
umbral de Avanzado es, medido, convertir Básico en Avanzado.**

Las 80 celdas del §3.2, todas con `subidaFuerte.porReto.basico = true` y un
factor a la vez encima. El `mañoso` de mesa 2 es V1; el de mesa 5, V2.

| Variante | V1 m2 victorias · mediana · p10 | V2 m5 mediana · p10 | espejo m2 mediana | espejo m5 mediana | V4 espejo m2 · m5 |
|---|---|---|---|---|---|
| `on` | 82.74 % · 192 · 51 | 40 · 3 | 114 | 10 | 47.12 % · 61.27 % |
| `on+porMesaB+2` | 88.38 % · 217 · 73 | 42 · 3 | 290 | 12 | 46.92 % · 61.11 % |
| `on+porMesaB+4` | 88.89 % · 199 · 56 | 50 · 3 | 308 | 17 | 47.59 % · 62.45 % |
| `on+porMesaB+6` | 90.48 % · 206 · 66 | 68 · 4 | 380 | 30 | 47.27 % · 61.75 % |
| `on+fraccion=0.25` | 82.69 % · 229 · 68 | 40 · 3 | 164 | 8 | 46.73 % · 61.21 % |
| `on+fraccion=0.33` | 76.11 % · 253 · 77 | 41 · 3 | 209 | 7 | 46.99 % · 60.70 % |
| `on+allIn=31` | 82.54 % · 178 · 40 | 40 · 3 | 113 | 9 | 46.25 % · 61.09 % |
| `on+allIn=35` | 82.28 % · 172 · 33 | 40 · 3 | 111 | 10 | 46.33 % · 61.41 % |
| `on+bloque=15` | 81.25 % · 183 · 51 | 41 · 3 | 87 | 10 | 48.86 % · 56.91 % |
| `on+bloque=20` | 77.96 % · 178 · 41 | 40 · 3 | 86 | 10 | 48.69 % · 57.68 % |

Referencia sin encender: V1 92,20 % · 202 · p10 58.


#### Lo que Básico sí tiene por separado

Tres mandos por reto viven fuera de la rama de §6.3 y por tanto funcionan con
Básico como está: `fraccionPozo` (§6.5 y el respaldo del all-in de §6.6),
`allIn.puntajeMin` y `farol.bloquePorReto`. Los tres barridos, 88 celdas:

| Variante de Básico | V4 espejo m2 · m3 · m4 · m5 | V3 caída m2 · m3 · m4 · m5 | `mañoso` m5 victorias |
|---|---|---|---|
| — (hoy) | 46,40 · 56,07 · 57,58 · 59,02 | 44,9 · 37,5 · 38,0 · 33,5 | 76,32 % |
| `fraccionPozo = 0,25` | 47,53 · 51,62 · 52,88 · 53,23 | 43,8 · 41,0 · 48,5 · 47,2 | 89,96 % |
| `fraccionPozo = 0,33` | 47,53 · 51,62 · 53,06 · 52,87 | 34,4 · 40,9 · 48,6 · 50,7 | 93,49 % |
| **`fraccionPozo = 0,40`** | **43,64 · 49,43 · 50,30 · 51,23** | **34,1 · 40,7 · 49,0 · 51,4** | 94,21 % |
| `bloque = 15` | 49,22 · 56,68 · 59,23 · 61,26 | 41,8 · 37,3 · 36,2 · 33,1 | 75,95 % |
| `allIn.puntajeMin = 31` | 46,40 · 56,07 · 57,58 · 59,02 | 45,5 · 39,1 · 38,7 · 33,4 | 76,20 % |

**`fraccionPozo.basico = 0,40` es el único mando que mete V4 de Básico en rango
en las cuatro mesas**, y de paso ensancha la escalera de V3 en vez de romperla
(las caídas de mesas 4 y 5 pasan de 38,0 y 33,5 a **49,0 y 51,4 pp**). El
`allIn.puntajeMin` de Básico no mueve V4 ni un dígito —31 y 35 dan el volcado
idéntico a la base—, y el bloque sólo arregla mesa 2, que ya estaba.

**Pero no es «encender Básico» en el sentido de D-13.** Con `fraccionPozo = 0,40`
Básico sigue jugando el **100 % de sus subidas a ×1** y llegando al all-in una
vez cada 2.500–5.000 manos: el multiplicador cuelga de `subidaFuerte`
(`aiPlayer.js:976`, `kAj = subidaFuerteActiva(reto) ? mayorK : 1`), no de la
fracción. Lo que hace 0,40 es que Básico **pague** mal, no que **suba** mal.



### D.9 · Sensibilidad de la vara, no del juego (punto 3 de la orden)

Las mismas celdas de V1 y V2 con el listón de subida del **conductor** bajado 4
y 8 puntos. `PAGA_MANOSO` sin cambio, los umbrales del archivo sin cambio
(`{2:40, 3:38, 4:36, 5:34}`), los dos listones del farol observable sin cambio.
El delta entra por `--manosoDelta`, vale 0 por defecto y **no se calibra**: es
una pregunta, no un mando.

| Vara | Reto | Δ | Listón del conductor | Victorias del `mañoso` | Mediana | p10 | p90 | Partidas |
|---|---|---|---|---|---|---|---|---|
| **V1** | básico | **0** | 40 | 92,20 % | **202** | 58 | 482 | 410 |
| V1 | básico | −4 | 36 | 95,82 % | **105** | 33 | 224 | 814 |
| V1 | básico | −8 | 32 | 96,08 % | **93** | 36 | 209 | 918 |
| **V2** | básico | **0** | 34 | 76,32 % | **186** | 13 | 493 | 4.967 |
| V2 | básico | −4 | 30 | 35,37 % | **42** | 5 | 428 | 8.772 |
| V2 | básico | −8 | 26 | 6,80 % | **16** | 3 | 226 | 12.105 |
| **V2** | avanzado | **0** | 34 | 43,60 % | **38** | 3 | 146 | 27.757 |
| V2 | avanzado | −4 | 30 | 15,40 % | **8** | 1 | 47 | 34.441 |
| V2 | avanzado | −8 | 26 | 8,08 % | **5** | 1 | 27 | 38.286 |
| **V2** | pro | **0** | 34 | 42,80 % | **42** | 3 | 167 | 22.690 |
| V2 | pro | −4 | 30 | 15,42 % | **8** | 2 | 43 | 31.095 |
| V2 | pro | −8 | 26 | 8,87 % | **5** | 1 | 24 | 36.091 |

**La respuesta es que no era el conductor.** En V1, aflojar el listón ocho puntos
—hasta 32, donde el `mañoso` sube con manos que Victor no subiría— acorta la
partida de 202 a **93** manos y **no la acerca al rango 8–20**; de paso las
victorias suben a 96 %, o sea que el conductor no estaba siendo cauto de más:
estaba ganando igual, sólo que despacio. Contra Básico no hay forma de ganar
rápido porque no hay nada que ganar.

En V2 pasa lo contrario y es igual de informativo: aflojar el listón **sí** mete
la mediana en rango (Avanzado 38 → 8, Básico 186 → 16) pero **quebrando al
conductor**, no ganando — las victorias se desploman de 43,60 % a 8,08 %. Una
mediana corta comprada así no es la de V2: V2 pide una mesa que se resuelva
rápido, no un conductor que se suicide.

Conclusión: **la distancia de V1 no la puso el conductor.** Dónde la puso, lo
dice D.10.




### D.10 · Diagnóstico de profundidad (pila ÷ apuesta) — **se reporta, no se propone**

La ficha §5 deja la pila inicial y la entrada de mesa para 1e, así que esto **no
es una propuesta**: es la respuesta a «si no fue el conductor, ¿qué fue?».
La pila es 5.000 en todos los asientos y lo que se mueve es la apuesta de mesa,
que es el otro lado de la misma razón.

| Apuesta | Profundidad | V1 · victorias | V1 · mediana | p10 | V2 (m5 av) mediana | V7 (m5 espejo av) mediana |
|---|---|---|---|---|---|---|
| **50** | **100 antes** | 92,20 % | **202** | 58 | 38 | **10** |
| 100 | 50 | 82,49 % | 115 | 36 | 38 | 10 |
| 200 | 25 | **62,98 %** | 58 | 17 | 34 | 7 |
| 250 | 20 | 57,38 % | 50 | 16 | 31 | 6 |
| 500 | 10 | 22,84 % | 26 | 11 | **19** | 5 |
| 1.000 | 5 | 18,31 % | **11** | **5** | 8 | 2 |

**El mando de la duración es la profundidad, y ninguna cifra de `ajileiConfig.js`
la toca.** Con 100 antes de fondo, una partida de mesa 2 no puede terminar en 8–20
manos: sólo vaciar la pila a razón de un ante por mano son 100 manos, y el
`mañoso` se retira en la mayoría. Lo que sí se ve es que **cada mitad de la
profundidad divide la mediana casi exactamente por dos** —202, 115, 58, 50, 26,
11—, que es la firma de una partida gobernada por el fondo y no por la estrategia.

Y hay una tensión que el rector debe ver antes de decidir: **las dos mitades de
V1 viven en profundidades distintas.** Las victorias entran en rango a
profundidad **25** (62,98 %) y la mediana entra en rango a profundidad **5**
(11 manos), donde las victorias ya se han caído a 18,31 %. Lo mismo entre V2 y
V7: V2 pide una mesa que se resuelva rápido (profundidad 10 → mediana 19) y V7
pide que no se resuelva demasiado rápido (profundidad 100 → mediana 10, y baja
desde ahí). Con Básico encendido la tabla es la misma dentro del ruido
(82,74 → 78,72 → 61,43 → 54,49 → 22,13 → 17,77 %), lo que vuelve a decir que el
mando es el fondo.




---

## §E · La propuesta (STOP-2)

**Nada de esto está aplicado.** Es el diff exacto que 1d-iii escribiría si Victor
y el rector lo aprueban.

### E.1 · El diff de `ajileiConfig.js`

```diff
     subidaFuerte: {                                   // §6.3
-      porMesa: { 2: 41, 3: 40, 4: 36, 5: 33 },
+      // APU-1 1d §E. Mesas 4 y 5 SUBEN hasta que vuelve a existir la franja en
+      // la que la IA sube x1 (V6: umbral desplazado > raiseMin + opponentAdj,
+      // o sea > 34 en mesa 4 y > 36 en mesa 5). Mesas 2 y 3 no se tocan: su
+      // banda ya era +9 y +6.
+      porMesa: { 2: 41, 3: 40, 4: 38, 5: 39 },
       porReto: { basico: false, avanzado: true, pro: true },
     },
-    fraccionPozo: { basico: null, avanzado: 0.25, pro: 0.25 },
+    // APU-1 1d §E. 0,40 en los tres. En Avanzado y Pro es lo UNICO que mete V4
+    // en rango (la perdida del farol duro baja de 61,7 a 53,7 % en mesa 2 Pro);
+    // en Basico sustituye al `null` y baja de 59,0 a 51,2 % en mesa 5.
+    fraccionPozo: { basico: 0.40, avanzado: 0.40, pro: 0.40 },
     allIn: {                                          // §6.6
       puntajeMin: { basico: null, avanzado: 31, pro: 31 },
     },
```

**Dos líneas. Nada más se toca**, y cada valor que se queda como está se queda
porque ninguna vara pidió moverlo:

| Parámetro | Propuesta | Vara que lo justifica |
|---|---|---|
| `subidaFuerte.porMesa` 2 y 3 | **41 · 40** (sin cambio) | V6 ya daba +9 y +6; subir alarga las partidas sin ganar nada |
| `subidaFuerte.porMesa` **4** | **36 → 38** | **V6** (banda 0 → **+2**) y **V7** (mediana 19 → 24) |
| `subidaFuerte.porMesa` **5** | **33 → 39** | **V6** (banda −5 → **+1**) y **V7** (mediana 10 → **21**, el mínimo es 12) |
| `subidaFuerte.porReto.basico` | **`false`** (sin cambio) | **V7.** Ver E.2: encenderlo hunde la mediana del espejo de mesa 5 de 828 a **3** manos |
| `fraccionPozo` av · pro | **0,25 → 0,40** | **V4**, en las ocho celdas `espejo` de los dos retos |
| `fraccionPozo.basico` | **`null` → 0,40** | **V4** (mesas 3/4/5 de 56,1/57,6/59,0 a 49,4/50,3/51,2 %) y **V1** (victorias 92,2 → 81,4 %) |
| `allIn.puntajeMin` | **31 · 31** y `null` (sin cambio) | Ninguna. D.3: entre 27 y 35 no mueve una sola vara |
| `farol.bloquePorReto` | **12 · 8** y `null` (sin cambio) | Ninguna. D.4: ningún tamaño mete V4 en rango; la vara pide otra cosa (R-A) |
| `pasarConManoGrande` | **0 · 0,15 · 0,25** (sin cambio) | Ninguna. D.5: ±3 pp en mesa 2 y nada en mesa 5; en Básico está inerte (D-15) |
| `desplazamiento` | **±2** (sin cambio) | Ninguna. D.6: sólo mueve V6, que ya se arregla por `porMesa` |

### E.2 · Qué queda en rango si se aplica

Corrida completa de la propuesta, 24 celdas, 100.000 manos, semilla 23.

| Vara | Hoy | Con la propuesta | |
|---|---|---|---|
| **V1** m2 `mañoso` vs Básico | 92,20 % · 202 · p10 58 | 81,36 % · **282** · p10 118 | **FUERA** |
| **V2** m5 `mañoso` (bás/av/pro) | 186 / 38 / 42 · p10 13/3/3 | 217 / 62 / 68 · p10 89/4/5 | **FUERA** |
| **V3** caída Básico→Pro | 44,9 / 37,5 / 38,0 / 33,5 pp | **34,1 / 36,8 / 49,0 / 53,3 pp** | **EN RANGO** (orden: ver D-16) |
| **V4** farol duro pagado que pierde | 8 de 12 celdas fuera | **11 de 12 dentro** | **al filo** (m3 Pro 55,23 % ±0,28) |
| **V6** banda del ×1 | +9 / +6 / **0** / **−5** | **+9 / +6 / +2 / +1** | **EN RANGO** |
| **V7** m5 `espejo` (bás/av/pro) | 996 / **10** / 13 | 828 / **21** / **25** | **EN RANGO** |
| **V5** (reporte) m5 ×10 · quiebras | 72,4 % / 9,24 % · 73,4 % / 8,64 % | **40,4 % / 2,86 %** · **48,1 % / 3,28 %** | D-9 resuelto |

**Tres varas pasan de fuera a dentro (V4, V6, V7), V3 se ensancha y V5 baja a un
tercio.** V1 y V2 siguen fuera, y D.10 dice por qué: su mediana la gobierna la
profundidad pila÷apuesta, que es de 1e.

### E.2b · La disyuntiva de Básico, que es de Victor

El objetivo de D-13 —**que Básico ponga dinero**— y la vara V7 —**que la mesa no
se liquide sola en menos de 12 manos**— son, medidos, incompatibles con el juego
de reglas de hoy. Las tres esquinas, todas medidas:

| Configuración de Básico | V3 caída m4 · m5 | V4 m3 · m4 · m5 | **V7** m5 | D-13 · ×10 de Básico |
|---|---|---|---|---|
| **hoy** (`porReto` false, `fraccionPozo` null) | 38,0 · 33,5 pp | 56,1 · 57,6 · 59,0 % | **996** | **0 %** |
| **propuesta** (`fraccionPozo = 0,40`) | **49,0 · 53,3 pp** | **49,4 · 50,3 · 51,2 %** | **828** | **0 %** |
| `porReto = true`, umbral compartido | **0,84 · 2,75 pp** | 58,1 · 61,6 · 61,3 % | 10 | 67,7 % |
| `porReto = true` + umbral propio −8 (R-B) | 22,9 · 31,5 pp | 53,8 · 47,9 · 54,9 % | **3** | **89,7 %** |
| `porReto = true` + umbral propio +6 (R-B) | 22,2 · **0,4 pp**, invertido | 56,3 · 59,4 · 61,7 % | 30 | 30,2 % |

Con el umbral propio y bajo, Básico por fin empuja la pila —el 89,7 % de sus
subidas son ×10— y V3 y V4 aguantan; pero cinco Básicos en mesa 5 se liquidan
entre ellos en **3 manos**, que es la pesadilla exacta que V7 existe para
impedir. Con el umbral alto pasa lo contrario: V7 aguanta y Básico se vuelve más
difícil que Avanzado.

**Se propone la fila 2 y se deja D-13 abierto**, porque el arreglo que D-13 pide
no cabe en un valor: pide una regla que haga a Básico comprometer fichas **contra
un humano** sin que eso se multiplique entre cinco Básicos. Eso es R-D, y va con
la profundidad de D.10 a la misma decisión de 1e.




### E.3 · Reglas nuevas que los datos piden y que 1d **no escribe**

Van a una tanda propia de `aiPlayer.js`. Aquí quedan propuestas, con el dato que
las pide y el rango del archivo que abrirían.

#### R-A · Piso de puntaje para el farol, por mesa · **la que el rector previó**

**Lo que la pide.** D.4: **ningún** tamaño de bloque mete V4 en rango en mesas 2
y 3 para Pro, ni en mesas 3, 4 y 5 para ningún reto. El bloque decide **cuándo**
se farolea; V4 pregunta **con qué**, y con qué es exactamente lo que hoy no se
mira: el farol de §6.4 se adjudica por sorteo de bloque sin consultar el puntaje,
y el de ⑥ se dispara por la lectura del rival.

**El piso que los datos sugieren.** Histograma de 100.000 manos por celda, lectura
`espejo`, tasa de pérdida de las subidas pagadas por tramo de puntaje (mesa 2 Pro):

| Puntaje | 12–19 | 20–21 | 22–25 | **26–27** | **28–29** | 30–31 | 32+ |
|---|---|---|---|---|---|---|---|
| pierde | 85–88 % | 65,6 % | 70–73 % | **53,4 %** | **45,8 %** | 25,8 % | ≤ 21 % |

El acantilado está entre 25 y 30. Con un piso X, la población que V4 mide
—subidas con puntaje en `[X, 30)`— pierde:

| Piso | mesa 2 (bás · av · pro) | mesa 3 | mesa 4 | mesa 5 |
|---|---|---|---|---|
| 24 | 45,6 · 45,3 · **52,4** | 54,8 · 56,7 · 55,5 | 57,2 · 58,8 · 56,6 | 58,8 · 58,4 · 55,8 |
| **26** | **45,5 · 45,3 · 52,2** | 54,7 · 56,7 · 55,3 | 57,1 · 58,8 · 56,5 | 58,7 · 58,4 · 55,8 |
| **28** | 35,9 · 37,1 · 45,8 | **47,0 · 49,5 · 49,0** | **47,3 · 53,3 · 52,1** | **49,5 · 55,2 · 54,1** |

**Propuesta: `ia.farol.pisoPuntajePorMesa = { 2: 26, 3: 28, 4: 28, 5: 28 }`**, que
mete V4 en rango en **las doce celdas** (mesa 5 Avanzado queda en 55,2 %, 0,2 pp
sobre el techo y dentro de su propio error). Un piso único de 28 cuesta mesa 2,
donde Básico y Avanzado caerían a 36–37 %: por debajo del rango, o sea faroleando
de menos. Por eso va por mesa, como el umbral de §6.3.

**Dónde tocaría.** `aiPlayer.js` §6.4, en las **dos** vías: la adjudicación por
bloque (≈línea 1109, `_planFarol` / `_farol.idElegido`) y el farol con lectura de
⑥. Si sólo se pusiera en una, la otra seguiría faroleando con 21 — y es ⑥ la que
farolea más flojo (V4b: puntaje medio 23,1 en Pro contra 26,1 en Básico).

#### R-B · `porMesa` por reto · **de forma, no de cifra**

**Lo que la pide.** La ficha §3.2 pide encender Básico «con `porMesa` propio», y
eso **hoy no se puede escribir**: `aiPlayer.js:84` lee `(cfg.porMesa ?? {})[numPlayers]`,
un solo mapa para los tres retos. Encender `subidaFuerte.porReto.basico` le da a
Básico **el mismo umbral que Avanzado**, y ahí V3 se rompe: la caída Básico→Pro
pasa de 38,02 a **0,84 pp** en mesa 4 y de 33,52 a **2,75 pp** en mesa 5 (D.9).

**Propuesta:** `ia.subidaFuerte.porMesa` admite la forma anidada
`{ basico: {…}, avanzado: {…}, pro: {…} }` además de la plana, y
`umbralSubidaFuerte` prueba primero `porMesa[reto]?.[numPlayers]` y cae a
`porMesa[numPlayers]`. Es retrocompatible: con la forma plana de hoy no cambia
ni una decisión. **Dónde tocaría:** `aiPlayer.js:82-87`, tres líneas.

#### R-C · V3 necesita tolerancia en mesas 4 y 5 · **de vara, no de código**

No es una regla del juego: es una corrección de instrumento. En mesas 4 y 5
Avanzado y Pro están separados por **0,71 pp (1,08σ)** y **0,80 pp (1,80σ)** con
100.000 manos. El «estrictamente decreciente» de V3 decide ahí por ruido: la
misma configuración da el orden correcto en una corrida e invertido en otra. Se
propone que V3 exija el orden estricto sólo donde la diferencia supere 2σ, y que
en las demás mesas gatee únicamente la caída de ≥10 pp de Básico a Pro, que es la
parte que sí se sostiene. Ver **D-16**.

#### R-D · Compromiso de Básico que no se multiplica entre Básicos

**Lo que la pide.** E.2b: con el juego de reglas de hoy, hacer que Básico ponga
dinero (D-13) y que una mesa de cinco Básicos no se liquide en 3 manos (V7) son
incompatibles, porque la misma regla que hace a Básico empujar contra el humano
lo hace empujar contra los otros cuatro Básicos.

**Propuesta.** La única salida que no es un valor: que el compromiso de fichas de
Básico dependa de **contra quién** está la mano. Con `isHuman` ya leído en dos
sitios (`aiPlayer.js:641` y `:817`), un Básico podría aplicar la regla de §6.3
sólo cuando queda un humano en pie, y quedarse en la lógica de NIV-2 cuando la
mano es entre IAS. Es una asimetría declarada, no una trampa: la mesa de
entrenamiento no tiene por qué comportarse como la mesa de juego.

**Cuidado que trae.** Rompería la simetría que la puerta (b) del banco mide —el
`espejo` dejaría de ser una permutación honesta para Básico— y habría que
decidir qué mide entonces esa puerta en ese reto. **Va con la profundidad de
D.10 a la misma decisión de 1e**, porque las dos preguntan lo mismo: cuánto
dinero llega a la mesa y de dónde.

#### R-E · V6 no aplica a Básico · **de vara**

Si alguna vez se escribe R-B y Básico recibe un umbral **bajo** propio, su banda
del ×1 sale negativa a propósito: un Básico que sólo sabe empujar ×10 es
exactamente lo que lo hace el más fácil. La vara V6 —hoy `!encendida || banda > 0`—
lo leería como fallo. Se propone que V6 gatee sólo sobre Avanzado y Pro.




---

## §G · Hallazgos

### Del paso 0 (tanda 1d-i)

**D-11 ⚠ · salida de rango consignada, razón «la mesa se clava».** La ficha §1.2
abre de `gameEngine.js` **sólo** la línea de D-7. Hizo falta una segunda, en el
mismo `return` de `startHand`: `activePlayerIndex: primerTurno(players,
newManoIndex)`.

Por qué. `advanceFromDeal` (DEAL_2 → BET_1) **no recalcula el turno**: lo hereda
de `startHand`. Si la Mano se quedaba a cero pagando el ante, `BET_1` abría sobre
ella. Antes pasaba inadvertido —el asiento podía `pasar`, que es precisamente la
patología que D-7 denuncia—, pero con el all-in ya marcado no le queda **ninguna**
acción legal y la ronda no converge. Medido, no supuesto: el espejo de mesa 2
Básico reventó con `ronda BET_1 sin converger` y el estado volcado mostraba el
asiento activo con `allIn: true`, `chips: 0` y `accionesDe` vacío.

`primerTurno` es exactamente lo que `advanceBettingPhase` ya usa para `BET_2` y
`BET_3`. El **rol** de Mano no se mueve: sigue repartiendo y cobrando los
empates; lo único que cambia es quién habla primero. Cubierto por una prueba
nueva en `testMotorAPU1` (la cuarta del paso 0, la que suma 783 y no 782).

**RATIFICADO por el rector al abrir 1d-ii** como rango extendido.

**D-12 · un hueco que queda abierto, y no se puede cerrar desde aquí.** Si
**todos** los asientos vivos se quedaran a cero con el mismo ante, `primerTurno`
devuelve su `desde` por falta de candidatos y nadie podría actuar: `BET_1` no
tiene comprobación de ronda terminada a la entrada, porque hoy sólo se evalúa
después de una acción. No se ha observado ni una vez en ~1,4 millones de manos
del §C ni en los ~80 millones de 1d-ii, y taparlo exigiría una rama nueva en el
motor. **A 1e por decisión del rector.**

**D-13 · el `mañoso` mide, pero no se parece a Victor.** Victor quiebra a la IA
Básica en pocas manos; el conductor tarda 202. La transcripción es fiel a lo que
él describió, así que la distancia no está en el conductor: está en que **Básico
no pone dinero**.

**ACEPTADO EN PARTE por el rector, y 1d-ii lo cierra en dos mitades.** La primera
mitad —«no fue el conductor»— queda **demostrada** en D.9: aflojar el listón del
`mañoso` ocho puntos deja la mediana de V1 en 93 manos, a cinco veces del rango,
y le **sube** las victorias a 96 %. La segunda mitad —«fue Básico»— resulta ser
**sólo una parte**: D.10 muestra que el mando de la mediana es la profundidad
pila÷apuesta, que vale 100 antes y no la toca ninguna cifra de
`ajileiConfig.js`; y E.2b muestra que hacer que Básico ponga dinero choca de
frente con V7. **D-13 queda abierto y se reformula como R-D + la profundidad.**

### De los barridos (tanda 1d-ii)

**D-14 · la ficha estimaba ≈1 s por celda; son 1,8 s en mesa 2 y 31 s en mesa 5.**
Una celda de mesa 5 con conductor corre 17 veces más lenta que una de mesa 2,
porque cada mano consulta el cerebro de cuatro IAS en vez de una. Las 796 celdas
de 1d-ii se repartieron en 16 procesos paralelos y tardaron **unos 35 minutos de
reloj** en vez de las ~5 horas en serie. Para 1e: presupuestar los barridos por
mesa, no por celda.

**D-15 · `pasarConManoGrande.basico` está inerte, y no es un error del barrido.**
0 y 0,10 dan el volcado **idéntico al byte**. `aiPlayer.js:1162` tira ese dado
**dentro** de la rama `umbralFuerte !== null && …`, y `umbralFuerte` es `null`
mientras `subidaFuerte.porReto.basico` sea `false`. El valor de Básico en §6.8 no
decide nada hoy. No se propone tocarlo; se consigna para que nadie lo lea como
una cifra viva.

**D-16 · V3 decide por ruido en mesas 4 y 5.** Con 100.000 manos, Avanzado y Pro
están separados por **0,71 pp (1,08σ)** en mesa 4 y **0,80 pp (1,80σ)** en mesa 5.
El «estrictamente decreciente» de V3 da el orden correcto en una corrida e
invertido en la siguiente sin que nada haya cambiado de verdad: con la propuesta
de §E, Pro queda 0,94 y 2,47 pp **por encima** de Avanzado en esas dos mesas. La
parte de V3 que sí se sostiene es la caída Básico→Pro, que va de 34 a 53 pp. Ver
**R-C**.

**D-17 · `porMesa` es compartido entre los tres retos.** `aiPlayer.js:84` lee
`(cfg.porMesa ?? {})[numPlayers]` sin mirar el reto, así que «encender Básico con
`porMesa` propio» —lo que pide la ficha §3.2— **no se puede escribir hoy**. Ver
**R-B**.

**D-18 · el farol de la IA no mira su propia mano, y es lo que V4 mide.** El
histograma de 100.000 manos por celda muestra que las subidas respaldadas por un
puntaje **menor que 26** pierden entre el 65 y el 88 % de las veces que alguien
las paga, y que el acantilado está justo entre 25 y 30. Ningún tamaño de bloque
lo mueve, porque el bloque elige **cuándo** y no **con qué**. Ver **R-A**.



---

## §F y §H

Pendientes de la decisión: §F valores aplicados y bandas re-selladas · §H cierre
(tanda 1d-iii, hasta STOP-3).

---
