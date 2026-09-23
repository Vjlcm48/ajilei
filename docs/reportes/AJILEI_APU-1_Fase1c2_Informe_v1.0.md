# AJILEI · APU-1 · Fase 1c-2 — Informe · v1.0

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Fase:** 1c-2 — Piso del farol, umbral por reto, Básico contra el humano
**Ficha:** `AJILEI_APU-1_Fase1c2_v1.0.md` (2026-09-18)
**Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Estado:** **STOP-3** — reglas escritas y probadas (§B, §C), re-barrido con pilas
reales (§D, 238 celdas), propuesta (§E) y **aplicada y sellada** (§F, 84 celdas de
medición final). **Nada commiteado.**

---

## §A · Línea base

Base: `main` en `f9ee503` + 1a + 1b + 1c + 1d-i/ii, sin commitear.

### A.1 · Los protegidos, al abrir y al cerrar la tanda

| Archivo | Blob al abrir | Blob al cerrar | |
|---|---|---|---|
| `src/engine/gameEngine.js` | `e4fa160a0acf` | `e4fa160a0acf` | INTACTO (lleva el diff de 1d-i) |
| `src/engine/deck.js` | `eb61426083ca` | `eb61426083ca` | INTACTO (lleva el diff de 1d-i) |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | INTACTO |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | INTACTO |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | INTACTO |
| `src/hooks/cronicaCore.js` | `d6fe61a6069d` | **`d3e8bd6f9950`** | **ABIERTO** — L-7, autorizado por nombre |
| `src/engine/aiPlayer.js` | `5838277325b3` | **`8cfc3736cba2`** | **ABIERTO** — §2.2 + D-19 |
| `src/config/ajileiConfig.js` | `cf1870597fa9` | **`f93cc62631d8`** | libre · aplicado en 1c-2-iii |
| `src/engine/entrada.js` | `d84b8d86a14d` | **`67aa6ce9e899`** | libre · aplicado en 1c-2-iii |

**`aiPlayer.js` se abrió y sólo en los rangos autorizados.** Tres en STOP-1
(§2.2 de la ficha) y uno más en 1c-2-ii: la cuarta línea de R-D, el `§6.2` del
Ajilei, que el rector añadió al rango al decidir D-19. Ninguna salida de rango
que consignar. El archivo pasa de 1.289 a 1.445 líneas: **+156**, de las cuales
105 son comentario. Ni `peso` ni el contrato `{action, k, peso}` cambian, y no se
ha añadido ni retirado ningún `export` salvo el contador nuevo.

**`ajileiConfig.js` no se tocó en 1c-2-ii**: los 238 barridos corrieron con
`--param`, que sobreescribe la configuración **en memoria** y no toca el archivo.
Se aplicó en 1c-2-iii, con lo que el rector selló en STOP-2 (§F.1).

**`cronicaCore.js` se abrió en 1c-2-iii y sólo ahí.** Es la única edición fuera
del motor que la ficha permite, y el rector la autorizó por nombre al decidir L-7
(§F.3). El detalle de los blobs al cerrar, y el `git diff --stat` de los tres
archivos del motor, en §F.10.

### A.2 · Varas de entrada

`npx vitest run` antes de tocar nada: **30 archivos, 783 pruebas, 0 fallos**.
`npm run lint`: **21 problemas** (20 errores, 1 aviso), la línea base de siempre.

---

## §B · Las tres reglas, escritas

### B.1 · R-B · `subidaFuerte.porMesa` por reto

**Lo que la pedía.** D-17 del informe 1d: `aiPlayer.js:84` leía
`(cfg.porMesa ?? {})[numPlayers]`, **un solo mapa para los tres retos**. Encender
`porReto.basico` le daba a Básico el umbral de Avanzado y lo convertía en
Avanzado: la caída de V3 pasaba de 38,02 a **0,84 pp** en mesa 4 y de 33,52 a
**2,75 pp** en mesa 5. «Encender Básico con `porMesa` propio» —lo que pedía la
ficha 1d §3.2— no se podía escribir.

**Lo escrito.** `umbralSubidaFuerte` (`aiPlayer.js:81-107`, antes 6 líneas, ahora
9 de código) prueba primero `porMesa[reto]` y, si no es un objeto, cae al mapa
plano de siempre:

```js
const mapa   = cfg.porMesa ?? {}
const propio = mapa[reto]
const fuente = (propio !== null && typeof propio === 'object') ? propio : mapa
const base   = fuente[numPlayers]
```

**Retrocompatible por construcción, no de palabra:** con la forma plana el
índice `mapa['basico']` es `undefined`, no es objeto, y se lee el mapa de
siempre. Un reto sin entrada anidada dentro de un mapa mixto cae también a la
plana. Lo sella la primera prueba de C.2, decisión a decisión sobre 600 casos.

### B.2 · R-A · Piso de puntaje para el farol, por mesa

**Lo que la pedía.** D.4 y D-18 del informe 1d: ningún tamaño de bloque metía V4
en rango, porque **el bloque decide CUÁNDO se farolea y V4 pregunta CON QUÉ**. El
histograma de 100.000 manos por celda mostró que las subidas respaldadas por
menos de 26 puntos pierden entre el 65 y el 88 % de las veces que alguien las
paga, y que el acantilado está entre 25 y 30.

**Lo escrito.** Un lector nuevo, `pisoFarolDe(numPlayers)`, que devuelve **0**
—o sea, sin piso y con la conducta exacta de 1c— cuando el mapa no existe. Entra
en **las dos vías** del farol, porque si sólo entrase en una la otra seguiría
faroleando con 21, y es ⑥ la que farolea más flojo (V4b de 1d: puntaje medio 23,1
en Pro contra 26,1 en Básico):

| Vía | Dónde | Qué hace bajo el piso |
|---|---|---|
| **bloque** (§6.4) | el paso 2 de la fila de APU-1 | **traslada** el plan a otra mano del bloque |
| **⑥** (lectura de Pro) | `const farolar` | no farolea, y ya: es reactivo, no hay plan que reprogramar |

**El traslado.** `_trasladarFarol(state, B, motivo)` re-sortea la mano elegida
entre las que **quedan** del bloque (`handCount+1 … inicio+B−1`). Si ésta era la
última, el bloque se queda sin farol y se cuenta. El normativo §6.4 promete *un
farol por bloque*, no *un intento por bloque*: un plan que no se puede ejecutar
no se pierde, se aplaza.

**Dos decisiones de orden, las dos deliberadas y las dos con consecuencia
medible:**

1. En la vía ⑥ **el dado se tira ANTES del piso**:
   ```js
   const dadoFarol = farolRespaldado && rng() < FREC_FAROL
   const farolar   = dadoFarol && scoreEf >= pisoFarol
   ```
   Así el consumo de azar de esa rama es byte a byte el de 1c y lo único que el
   piso cambia es la decisión, nunca la baraja. Al revés —piso primero— cada mano
   floja se ahorraría un `rng()` y desplazaría todo lo que viene después.
2. En la vía del bloque el traslado **sí** consume un `rng()`, y no hay forma de
   evitarlo: el re-sorteo es el remedio. Es una de las dos razones por las que el
   oro puede moverse en esta tanda (ver §C.4).

**El piso se compara contra `scoreEf`, no contra el puntaje crudo**, y eso tiene
una consecuencia que conviene tener delante: en `BET_3` con lectura de ② viva, un
Pro puede farolear con una mano de 21 puntos crudos si la lectura dice que vale
más. Es lo correcto —el piso pregunta «¿respalda mi mano esta subida?», y la
lectura es parte de la respuesta— pero significa que el piso **no** es un suelo
sobre las cartas. Medido en C.3.

### B.3 · R-D · El compromiso depende de contra quién se juega

**Lo que la pedía.** E.2b del informe 1d: con el juego de reglas de 1c, «que
Básico ponga dinero» (D-13) y «que una mesa de cinco Básicos no se liquide en 3
manos» (V7) son, **medidos**, incompatibles — la misma regla que hace a Básico
empujar contra el humano lo hace empujar contra los otros cuatro Básicos.

**Lo escrito.** Dos lectores (`soloContraHumanoDe(reto)`, `humanoEnMano(state)`)
y un solo booleano en la decisión:

```js
const empuja = !soloContraHumanoDe(reto) || humanoEnMano(state)
```

`humanoEnMano` usa la misma definición de «vivo» que el sorteo del farol: humano,
no retirado y no eliminado. Con `soloContraHumano` apagado —Avanzado y Pro—
`empuja` vale `true` siempre y no cambia absolutamente nada.

**El reparto de pasos es exactamente el de la ficha §2.2**, y cada lado tiene su
razón:

| Paso | Con `empuja = false` | Por qué |
|---|---|---|
| 2 · farol de bloque | **se suspende y se traslada** | no se consume: no se faroleó |
| 5 · subida fuerte | no se evalúa | es el empuje |
| 6 · pasar con mano grande | no se evalúa | vive dentro del 5 |
| 3 · all-in | **se evalúa siempre** | «all-in es responder», no empujar |
| 4 · trampa armada | se evalúa siempre | y se neutraliza sola: sólo la arma el paso 6 |
| 7 · cuarto del pozo | **se evalúa siempre** | es un PAGO, no un empuje |

La decisión cae entonces a la lógica de NIV-2, que sube **×1**.

**La cuarta línea de R-D: el Ajilei (D-19, decidido al abrir 1c-2-ii).** En
STOP-1 el multiplicador del Ajilei (`aiPlayer.js` §6.2) quedó fuera de R-D porque
la ficha §2.2 nombraba los pasos 2, 5 y 6 y el §6.2 no estaba en esa lista. Se
consignó como D-19 y **el rector lo metió dentro**. Escrito antes de barrer:

```js
const kAj = (empuja && subidaFuerteActiva(reto)) ? (mayorK(accion) ?? 1) : 1
```

El argumento del propio archivo se lee en las dos direcciones: si §6.2 «no es más
que A-3 adelantada», lo que apague A-3 tiene que apagar §6.2, o un Básico entre
IAS subiría ×1 con 45 puntos y ×10 con 51. **La invariante no se toca**: con el
Ajilei no se retira jamás, haya humano o no; lo único que R-D cambia ahí es el
monto. `empuja` sube por delante de esa rama, que es lo único que se movió de
sitio. Dos pruebas nuevas en el bloque 10 (C.2).

### B.4 · Configuración de TRABAJO (`ajileiConfig.js`, en STOP-1)

Exactamente la de la ficha §2.1, con las cifras de trabajo marcadas. **La
configuración sellada —la que queda en el archivo— está en F.1.**

```js
subidaFuerte: {
  porMesa: {
    basico:   { 2: 33, 3: 32, 4: 30, 5: 31 },   // TRABAJO · Avanzado − 8
    avanzado: { 2: 41, 3: 40, 4: 38, 5: 39 },   // SELLADO (1d §E)
    pro:      { 2: 41, 3: 40, 4: 38, 5: 39 },   // SELLADO (1d §E)
  },
  porReto: { basico: true, avanzado: true, pro: true },
},
soloContraHumano: { basico: true, avanzado: false, pro: false },   // R-D
fraccionPozo: { basico: 0.25, avanzado: 0.25, pro: 0.25 },         // provisional
farol: {
  bloquePorReto: { basico: 15, avanzado: 12, pro: 8 },
  pisoPuntajePorMesa: { 2: 26, 3: 28, 4: 28, 5: 28 },              // R-A · TRABAJO
},
```

`allIn.puntajeMin`, `pasarConManoGrande` y `desplazamiento`, sin cambio.

### B.5 · Banco (`bancoNiveles.mjs`, archivo libre)

| Qué | Detalle |
|---|---|
| **`--entrada k`** | Asiento 0 con `k × unit`; cada IA con lo que reparta `entrada.pilaIA`. **Sin `--entrada` no cambia nada**: los 5.000 de siempre. En 1c-2-ii el banco llevaba una COPIA de la fórmula de §2.3; en 1c-2-iii pasó a llamar a `entrada.js`, y por eso heredó el cambio de margen a factor sin tocarse (F.2). |
| `--unit` | Ya estaba en línea de órdenes desde 1c (`bancoNiveles.mjs:148`); no hizo falta tocarlo. |
| **R-C** | V3 exige el orden estricto **sólo donde el par se separa 2σ**; la caída Básico→Pro ≥ 10 pp gatea siempre. Usa el SE de conglomerado que la celda ya traía (`seVictoriasJ0`). |
| **R-E** | V6 gatea sólo sobre Avanzado y Pro. **Sigue reportando** la banda de Básico: lo único que cambia es que no la cuenta como fallo. |
| **V6 lee R-B** | La vara replicaba la lectura vieja de `porMesa`; con la forma anidada habría informado `null` en todo. Ahora lee igual que `aiPlayer.js:88-92`. |
| Métricas | `reglas1c2` por celda: `trasladados`, `trasladadoPiso`, `trasladadoSinHumano`, `bloqueAgotado`, `tasaTraslado`, `farolSeisBloqueado`, `decisionesSinHumano`, `manosSinHumano`. |

**Lo que 1c-2-iii añadió encima**, todo en el mismo archivo libre:

| Qué | Detalle |
|---|---|
| **V1, V2 y V3 por entrada** | `RANGOS.V1` se juzga a 50× (victorias 60–80 %, duración sólo reporte), `RANGOS.V2` a 15× (mediana 10–35, p10 ≥ 3) y V3 a 15× también; las demás entradas se reportan. Si no hay celda a la entrada pedida, V3 usa la que haya, para que los volcados anteriores a 1c-2 se sigan leyendo. |
| **`RANGOS.V4` a 40–60 %** | Las palabras de Victor, según el rector: «la mitad o tal vez un 40 %». |
| **La vara de bandas se muda** | A `scripts/apu1_bandas.json`, que **sí se rastrea**. `--vara-bandas <ruta>` para leer otra. La clave gana `\|e=<entrada>` y `\|n=<manos>` (F.5). |
| **`--varas` lee barridos** | Además de los volcados normales, acepta la salida de `--barrido`, donde las varas viven una por celda. |

**Por qué `--entrada` se rechaza bajo `espejo`, y no por prudencia:** la puerta
(b) del banco comprueba que bajo el espejo cada asiento se lleva 1/N de las
manos, y esa permutación sólo es honesta si las pilas son iguales. Con entrada,
el asiento 0 arrancaría con menos que el resto y el espejo dejaría de medir la
simetría del cerebro para medir la del bolsillo.

---

## §C · Las pruebas

### C.1 · El recuento

**En STOP-2: 805 pruebas, 799 verdes, 6 rojas.** Las seis rojas eran **las dos
pruebas de oro** (`testNivel1 §1` y `testNivel2 §1`, tres semillas cada una), que
la ficha §0 autorizó expresamente a estar rojas entre STOP-1 y STOP-3. De 783 a
805 hay **+22 pruebas**: 14 de las tres reglas, 2 de D-19, 3 de la contabilidad
del oro (C.4), 2 de ventana de fixture y 1 de R-A en la vía ⑥.

**En STOP-3: 818 pruebas, 0 fallos**, el oro re-derivado incluido. Las trece de
1c-2-iii son 9 de `testCronica` —el sexto verbo y sus sesiones con pilas reales,
F.3—, 2 de la fórmula nueva de §2.3 en `testEntrada` y 2 del techo de puntaje
(D-29, §G). El detalle está en F.10.

`npm run lint`: **21** — Δ = 0 en los dos stops.

### C.2 · Lo que cada bloque nuevo sella

| Bloque | Pruebas | Lo que afirma |
|---|---|---|
| **2 · A-3** | +2 | el **techo de 41 puntos** de una mano que no es Ajilei, y que el umbral sellado de Básico en mesa 2 queda por encima de él: §6.3 sólo entra ahí con el descuento del temperamento (D-29, escritas en 1c-2-iii) |
| **8 · R-B** | 3 | la forma plana y la anidada equivalente dan **la misma decisión en 600 casos** (200 mesas × 3 retos, con el mismo generador sembrado) · cada reto lee su umbral · un reto sin entrada anidada cae a la plana |
| **9 · R-A** | 5 | bajo el piso no farolea y el plan **se traslada** en vez de gastarse · sobre el piso sí farolea con la misma fixture y el mismo dado · el traslado cae dentro del bloque y ahí sí farolea · si cae fuera, el bloque se queda sin farol · el piso va por mesa |
| **10 · R-D** | 8 | Básico con humano sube con el mayor `k` · el **mismo estado** sin humano cae a NIV-2 con `k = 1` · con el humano **retirado** tampoco empuja · Avanzado no cambia · all-in y cuarto del pozo se evalúan igual sin humano · un farol en curso se suspende y traslada · **el Ajilei de §6.2 sube ×1 sin humano y no se retira jamás** (D-19) · y en Avanzado el Ajilei sigue empujando |
| **Legalidad** | — | las 500 mesas × 3 retos siguen verdes, **ahora con Básico encendido** |
| **Proxy (D-5)** | — | la trampa recorre las ramas nuevas en los **tres** retos; `isHuman` se lee, `cards` ajenas no |

Los contadores se miden **por diferencia**, nunca por valor absoluto:
`fijarPerfil` decide de verdad hasta 600 veces con el azar real y en una de cada
`B` corridas deja un farol ejecutado detrás. Medirlos en absoluto habría dado
pruebas intermitentes.

### C.3 · Las cinco pruebas que cambiaron de veredicto, y por qué

Ninguna se ha borrado. Las cinco decían algo verdadero hasta 1d y esta tanda las
convierte en su contrario **por decisión de la ficha**, no por accidente:

| Prueba | Decía | Dice ahora | Regla |
|---|---|---|---|
| `testIAAPU1` §2 | «Básico no sube fuerte (neutro hasta 1d)» | sube fuerte **contra el humano**, y con SU umbral | R-B + R-D |
| `testIAAPU1` §3 | «Básico ignora el cuarto del pozo» | ya lo aplica; y **se evalúa también sin humano** | `fraccionPozo.basico` |
| `testIAAPU1` §5 | «en Básico no hay farol por bloques, ni uno» | ya tiene bloque (15), y con humano farolea | `bloquePorReto.basico` |
| `testIAAPU1` §6 | «Básico nunca pasa con mano grande» | sube fuerte pero **nunca arma la trampa** (`p = 0`) | R-B |
| `testNivel1` §6 (×2) | «Básico sí regala la mano / sí se va» | los tres retos se quedan | `fraccionPozo.basico` |

Con esa última, **D-15 de 1d queda cerrado por el otro lado**: el valor de Básico
en §6.8 ya no está inerte por `umbralFuerte === null`, está en cero porque vale
cero. Si alguien lo sube, ahora se nota.

**`testNivel2` §5 (⑥) aparta el piso de R-A a propósito.** Sus siete pruebas
sellan las tres condiciones de ⑥ —lectura viva, respaldo que cubre el precio,
dado— con una mano de 16 puntos, que es la que hace que un farol sea un farol.
Entrelazar R-A ahí habría obligado a cambiar la mano de la fixture y las siete
habrían dejado de medir lo que dicen medir. **R-A se mide sola**, en una prueba
nueva al final del bloque, con el piso de verdad puesto y comprobando que las
otras tres condiciones **sí** se cumplieron (`farolRespaldado > 0`): lo único que
faltó fue la mano.

En `testIAAPU1` §5 la farolera pasa de una mano de 13 puntos a una de 31, con la
ventana comprobada por una prueba propia: 31 ≥ el piso de la mesa (28), 31 < el
`openMin` de CONSERVADORA en el pie (32) —así, sin farol, esa misma mano **pasa**,
que es lo que miden las pruebas del negativo— y 31 < el umbral de §6.3 de
Avanzado (42), así que el paso 5 no puede explicar la subida.

### C.4 · La contabilidad del oro (en STOP-2)

Lo que sigue es lo que se midió **antes** de aplicar, con las cifras
provisionales y el oro todavía rojo. El oro re-derivado y la contabilidad contra
las cifras **selladas** están en **F.4**, y dicen lo mismo con otros números.

Las dos pruebas de oro están rojas. Lo que se puede afirmar sin re-derivarlas
—y lo que tres pruebas nuevas afirman— es esto:

> **Con `ajileiConfig.js` devuelto a las cifras de 1d, el oro vuelve a estar
> VERDE con el código de 1c-2 dentro.**

O sea: **la máquina nueva no mueve el oro; lo mueven las cifras.** R-A, R-B y R-D
son retrocompatibles al byte con la configuración vieja, y si alguna vez dejaran
de serlo esa prueba lo cantaría.

De paso cuenta y atribuye. Batería de **12.672 decisiones** por semilla
(6.336 casos × 2 pasajeros), reviertiendo cada cifra **sola**:

| Semilla | Decisiones que cambiaron | `fraccionPozo.basico` | `porReto.basico` | `porMesa` anidado | bloque | piso (R-A) | R-D |
|---|---|---|---|---|---|---|---|
| 0,05 | **300** (2,4 %) | 300 | 0 | 0 | 0 | 0 | 0 |
| 0,50 | **510** (4,0 %) | 366 | 144 | 144 | 0 | 0 | 0 |
| 0,95 | **1.462** (11,5 %) | 382 | 1.080 | 168 | 0 | 0 | 0 |

Se lee sola:

- **`fraccionPozo.basico` es el grueso con el dado bajo** (300 de 300): Básico
  paga barato donde antes se iba, y eso no depende de ningún dado.
- **`porReto.basico` domina con el dado alto** (1.080 de 1.462), y es exactamente
  donde tiene que estar: con el dado en 0,95 la escalera de NIV-2 **no** sube, así
  que §6.3 es lo único que puede subir. Con el dado en 0,05 la escalera ya subía
  y §6.3 no añade nada.
- **`porMesa` anidado explica un subconjunto** del anterior (144 y 168): son las
  decisiones que vuelven al oro sólo porque el mapa plano deja a Básico con el
  umbral **más alto** de Avanzado.
- **El bloque de farol, R-A y R-D no mueven el oro ni una decisión**, y tiene
  explicación: la batería fija `handCount: 3` en estados sintéticos donde el
  sorteo del bloque casi nunca cae, y el humano está siempre vivo, así que R-D no
  llega a dispararse.

### C.5 · Convergencia (en STOP-2)

36 celdas (4 mesas × 3 conductores × 3 retos), 5.000 manos, `--seed 11`,
`--sinReloj`. **Cero «sin converger».** Las cuatro puertas del banco, verdes.
Repetida con la configuración final en 1c-2-iii, con el mismo resultado (F.10),
y esas 36 celdas entran ahora en la vara de bandas (F.5).

Evidencia: `capturas-dsk/_conv1c2/spec.json` y `capturas-dsk/1c2_conv.json`;
la repetición, en `capturas-dsk/_conv1c2f/`.

**No es un barrido** —5.000 manos no miden nada— pero dos cosas se ven ya, y las
dos son el motivo de la tanda:

**R-D funciona, y bajo `espejo` es total.** Básico ejecuta **cero** faroles de
bloque en las cuatro mesas del espejo: los 1.370 / 9.050 / 11.185 / 21.773 planes
se trasladan por falta de humano, y `manosSinHumano` sale 100 %. La mediana del
espejo de mesa 5 con Básico encendido es **528 manos**, no 3. Eso es E.2b del
informe 1d resuelta por el lado que el rector pidió.

**La tasa de traslado de R-A no delata un piso demasiado alto.** La ficha §3.2
fija el aviso en «más del 50 % de los bloques». Contado por bloque —los que
acaban sin farol sobre los que se resuelven— sale:

| | mesa 2 | mesa 3 | mesa 4 | mesa 5 |
|---|---|---|---|---|
| `espejo` av · pro | 21 · 27 % | 35 · 42 % | 32 · 37 % | 31 · 39 % |
| `mañoso` bás · av · pro | 32 · 29 · 37 % | 48 · 44 · **51 %** | 44 · 41 · 46 % | 43 · 38 · 43 % |
| `aleatorio` bás · av · pro | 17 · 18 · 24 % | 32 · 30 · 35 % | 17 · 19 · 26 % | 13 · 18 · 25 % |

**Una sola celda roza el 50 %** (mesa 3 Pro contra el mañoso, 51 %). El piso
`{2:26, 3:28, 4:28, 5:28}` no está estrangulando al bloque; el barrido de §3.2 lo
confirmará o lo moverá con 100.000 manos. (El 100 % de Básico bajo espejo no
cuenta: ése es R-D, y es a propósito.)

---

## §D · Re-barrido con pilas reales

**238 celdas**, todas con `--seed 23 --sinReloj`, **100.000 manos** y `unit` 100,
en cuatro rondas de 16 (12 la última) procesos paralelos:

| Ronda | Celdas | Qué |
|---|---|---|
| 1 | 144 | referencia de §3.1 (36) y los cinco barridos de §3.2 (108) |
| 2 | 46 | el sondeo que los datos de la ronda 1 pidieron (D.10, D.11) |
| 3 | 36 | **la propuesta entera**, para la tabla de las siete varas de §E |
| 4 | 12 | el piso de R-A puesto a cero, para saber si R-A gana su sitio (D.7) |

Evidencia en `capturas-dsk/_bar1c2/` (specs) y `capturas-dsk/1c2*_t??.json`
(volcados). Ninguna celda dio «sin converger»; las cuatro puertas del banco,
verdes en las 238.

### D.1 · V1 y V2 con las pilas de la pantalla

`mañoso`, `unit` 100, 100.000 manos, semilla 23. La entrada del humano es
`k × 100` y cada IA se sienta con `min(k × 100 + 1.000, 5.000)`.

| Mesa | Reto | Entrada | Profundidad | Victorias | Mediana | p10 | p90 | Partidas |
|---|---|---|---|---|---|---|---|---|
| 2 | basico | 5× | 5 antes | 6.20% ±0.36 | **13** | 5 | 52 | 4405 |
| 2 | basico | 15× ·**eval** | 15 antes | 42.58% ±1.18 | **42** | 17 | 118 | 1752 |
| 2 | basico | 50× | 50 antes | 73.23% ±1.44 | **82** | 18 | 229 | 945 |
| 2 | avanzado | 5× | 5 antes | 7.02% ±0.39 | **14** | 5 | 50 | 4329 |
| 2 | avanzado | 15× ·**eval** | 15 antes | 40.71% ±1.16 | **39** | 17 | 118 | 1803 |
| 2 | avanzado | 50× | 50 antes | 76.46% ±1.56 | **114** | 30 | 258 | 735 |
| 2 | pro | 5× | 5 antes | 2.49% ±0.20 | **12** | 5 | 35 | 5830 |
| 2 | pro | 15× ·**eval** | 15 antes | 25.40% ±0.98 | **38** | 17 | 102 | 1957 |
| 2 | pro | 50× | 50 antes | 62.88% ±1.99 | **131** | 38 | 334 | 590 |
| 5 | basico | 5× | 5 antes | 25.20% ±0.22 | **8** | 2 | 59 | 40773 |
| 5 | basico | 15× ·**eval** | 15 antes | 48.55% ±0.30 | **27** | 3 | 93 | 28369 |
| 5 | basico | 50× | 50 antes | 57.76% ±0.38 | **34** | 4 | 109 | 17115 |
| 5 | avanzado | 5× | 5 antes | 27.44% ±0.24 | **7** | 2 | 61 | 33348 |
| 5 | avanzado | 15× ·**eval** | 15 antes | 50.98% ±0.32 | **32** | 3 | 115 | 24624 |
| 5 | avanzado | 50× | 50 antes | 54.24% ±0.40 | **65** | 5 | 215 | 15766 |
| 5 | pro | 5× | 5 antes | 24.02% ±0.24 | **7** | 2 | 65 | 32466 |
| 5 | pro | 15× ·**eval** | 15 antes | 46.11% ±0.33 | **33** | 3 | 134 | 22552 |
| 5 | pro | 50× | 50 antes | 49.84% ±0.43 | **65** | 5 | 239 | 13260 |

**V1** (mesa 2 vs Básico: victorias 60–70 %, mediana 8–20, p10 ≤ 6) y
**V2** (mesa 5, mediana 10–25, p10 ≥ 4), evaluadas a **15×**:

| Vara | Celda | Victorias | Mediana | p10 | Cumple |
|---|---|---|---|---|---|
| **V1** | mesa 2 · Básico · 15× | 42.58% | 42 | 17 | FUERA |
| **V2** | mesa 5 · basico · 15× | 48.55% | 27 | 3 | FUERA |
| **V2** | mesa 5 · avanzado · 15× | 50.98% | 32 | 3 | FUERA |
| **V2** | mesa 5 · pro · 15× | 46.11% | 33 | 3 | FUERA |

### D.2 · La matriz de referencia (V3, V4, V4b, V7)

**V3** · victorias del `mañoso` a 15×, con R-C (el orden estricto sólo donde el par se separa 2σ):

| Mesa | Básico | Avanzado | Pro | Caída B→P | σ(B,A) | σ(A,P) | Cumple |
|---|---|---|---|---|---|---|---|
| 2 | 42.58% | 40.71% | 25.40% | **17.2 pp** | 1.13 | 10.08 | **EN RANGO** |
| 3 | 56.19% | 57.37% | 48.76% | **7.4 pp** | 1.42 | 10.29 | FUERA |
| 4 | 53.16% | 57.87% | 52.99% | **0.2 pp** | 9.52 | 9.57 | FUERA |
| 5 | 48.55% | 50.98% | 46.11% | **2.4 pp** | 5.60 | 10.60 | FUERA |

**V4** (farol duro pagado que pierde, 40–55 %) y **V4b** (puntaje medio del farol duro) bajo `espejo`:

| Mesa | Reto | V4 | ±σ | Pagados | V4b puntaje | Faroles | Cumple |
|---|---|---|---|---|---|---|---|
| 2 | basico | **46.75%** | 0.41 | 14820 | 25.4 | 16160 | **EN RANGO** |
| 2 | avanzado | **45.69%** | 0.45 | 12334 | 25.7 | 14844 | **EN RANGO** |
| 2 | pro | **53.66%** | 0.33 | 23423 | 25.2 | 31783 | **EN RANGO** |
| 3 | basico | **52.32%** | 0.16 | 99885 | 25.2 | 113960 | **EN RANGO** |
| 3 | avanzado | **57.00%** | 0.24 | 42731 | 25.6 | 52816 | FUERA |
| 3 | pro | **54.89%** | 0.19 | 70838 | 25.6 | 94084 | **EN RANGO** |
| 4 | basico | **53.26%** | 0.09 | 298717 | 25.1 | 340002 | **EN RANGO** |
| 4 | avanzado | **58.30%** | 0.17 | 80411 | 25.7 | 103914 | FUERA |
| 4 | pro | **56.68%** | 0.16 | 96452 | 25.7 | 132157 | FUERA |
| 5 | basico | **53.71%** | 0.07 | 530722 | 24.9 | 601280 | **EN RANGO** |
| 5 | avanzado | **59.63%** | 0.15 | 114338 | 25.7 | 154170 | FUERA |
| 5 | pro | **56.60%** | 0.13 | 138640 | 25.7 | 192931 | FUERA |

**V7** · `espejo` a pila = techo (5.000 = 50 × 100), mediana ≥ 12 manos:

| Mesa | Básico | Avanzado | Pro |
|---|---|---|---|
| 2 | 359 | 46 | 41 |
| 3 | 422 | 41 | 40 |
| 4 | 405 | 23 | 25 |
| 5 ·**V7** | 270 | 23 | 28 |

### D.3 · `subidaFuerte.porMesa.basico` — 40 celdas (mira V1, V3, V7)

Avanzado menos 10, 8, 6, 4 y 2 puntos en las cuatro mesas a la vez. El −8
(`{2:33, 3:32, 4:30, 5:31}`) es la base de STOP-1.

| Δ | Umbrales | V1 m2 vict · med | V3 caída m4 · m5 | V7 m5 espejo | espejo m2·m3·m4 |
|---|---|---|---|---|---|
| −10 | {31, 30, 28, 29} | 44.43% · 41 | -3.7 · 0.0 pp | **270** | 359 · 422 · 405 |
| **−8 ·base** | {33, 32, 30, 31} | 42.58% · 42 | 0.2 · 2.4 pp | **270** | 359 · 422 · 405 |
| −6 | {35, 34, 32, 33} | 39.02% · 40 | 1.2 · 2.4 pp | **270** | 359 · 422 · 405 |
| −4 | {37, 36, 34, 35} | 40.68% · 42 | 3.7 · 2.6 pp | **270** | 359 · 422 · 405 |
| −2 | {39, 38, 36, 37} | 42.23% · 43 | 4.3 · 3.3 pp | **270** | 359 · 422 · 405 |

### D.4 · V3 completa en el barrido de `porMesa.basico`

Victorias del `mañoso` a 15×. Avanzado y Pro no se mueven en este barrido —
sólo cambia el umbral de Básico— así que la caída Básico→Pro se lee sola.

| Δ | Básico m2·m3·m4·m5 | Caída B→P m2·m3·m4·m5 | Mesas con ≥ 10 pp |
|---|---|---|---|
| −10 | 44.4% · 52.0% · 49.3% · 46.1% | 19.0 · 3.2 · -3.7 · 0.0 | **1/4** |
| **−8 ·base** | 42.6% · 56.2% · 53.2% · 48.5% | 17.2 · 7.4 · 0.2 · 2.4 | **1/4** |
| −6 | 39.0% · 59.4% · 54.2% · 48.5% | 13.6 · 10.6 · 1.2 · 2.4 | **2/4** |
| −4 | 40.7% · 60.0% · 56.6% · 48.7% | 15.3 · 11.2 · 3.7 · 2.6 | **2/4** |
| −2 | 42.2% · 62.2% · 57.3% · 49.4% | 16.8 · 13.5 · 4.3 · 3.3 | **2/4** |

### D.5 · `fraccionPozo` en los tres retos — 36 celdas (mira V4, V7)

Con **R-A activa**. Se busca el MENOR valor que mantenga V4 en rango (40–55 %).

| f | Reto | V4 m2 | V4 m3 | V4 m4 | V4 m5 | V7 m5 | Celdas de V4 en rango |
|---|---|---|---|---|---|---|---|
| **0,25 ·base** | basico | 46.75% | 52.32% | 53.26% | 53.71% | 270 | **4/4** |
|  | avanzado | 45.69% | 57.00% | 58.30% | 59.63% | 23 | **1/4** |
|  | pro | 53.66% | 54.89% | 56.68% | 56.60% | 28 | **2/4** |
| 0,33 | basico | 46.75% | 52.32% | 54.42% | 54.06% | 266 | **4/4** |
|  | avanzado | 46.29% | 56.35% | 57.75% | 58.45% | 22 | **1/4** |
|  | pro | 53.49% | 55.10% | 55.92% | 56.32% | 25 | **1/4** |
| 0,40 | basico | 44.87% | 49.59% | 51.93% | 51.02% | 289 | **4/4** |
|  | avanzado | 44.64% | 52.75% | 53.60% | 52.79% | 16 | **4/4** |
|  | pro | 43.86% | 48.39% | 48.99% | 49.08% | 18 | **4/4** |

### D.6 · `farol.pisoPuntajePorMesa` — 36 celdas (mira V4, V4b y el traslado)

D-21, aceptado por el rector: **cada celda reporta V4 y V4b**, porque el piso
se compara contra `scoreEf` y no contra el puntaje crudo. La columna «sin
farol» es la fracción de bloques que se resuelven sin farolear: la ficha §3.2
avisa por encima del 50 %.

| Piso | Reto | V4 m2·m3·m4·m5 | V4b m2·m3·m4·m5 | sin farol m2·m3·m4·m5 | En rango |
|---|---|---|---|---|---|
| {24,26,26,26} | basico | 46.8% · 52.3% · 53.3% · 53.7% | 25.4 · 25.2 · 25.1 · 24.9 | 100% · 100% · 100% · 100% | **4/4** |
|  | avanzado | 46.0% · 55.6% · 57.0% · 58.6% | 25.6 · 25.7 · 25.8 · 25.7 | 23% · 21% · 20% · 20% | **1/4** |
|  | pro | 53.8% · 56.5% · 57.1% · 57.6% | 25.2 · 25.3 · 25.3 · 25.3 | 30% · 29% · 28% · 28% | **1/4** |
| **{26,28,28,28} ·base** | basico | 46.8% · 52.3% · 53.3% · 53.7% | 25.4 · 25.2 · 25.1 · 24.9 | 100% · 100% · 100% · 100% | **4/4** |
|  | avanzado | 45.7% · 57.0% · 58.3% · 59.6% | 25.7 · 25.6 · 25.7 · 25.7 | 23% · 38% · 35% · 35% | **1/4** |
|  | pro | 53.7% · 54.9% · 56.7% · 56.6% | 25.2 · 25.6 · 25.7 · 25.7 | 30% · 45% · 41% · 40% | **2/4** |
| {28,30,30,30} | basico | 46.8% · 52.3% · 53.3% · 53.7% | 25.4 · 25.2 · 25.1 · 24.9 | 100% · 100% · 100% · 100% | **4/4** |
|  | avanzado | 46.6% · 57.1% · 58.6% · 59.4% | 25.5 · 25.5 · 25.6 · 25.6 | 40% · 41% · 38% · 37% | **1/4** |
|  | pro | 50.9% · 54.1% · 55.5% · 56.3% | 25.8 · 25.6 · 25.6 · 25.6 | 46% · 50% · 46% · 46% | **2/4** |

### D.7 · ¿Gana R-A su sitio? El piso puesto a cero

Con la propuesta aplicada en todo lo demás, y `pisoPuntajePorMesa` a `{0,0,0,0}`,
que es la conducta de 1c: el farol no mira su propia mano.

| Mesa | Reto | V4 con piso | V4 sin piso | V4b con | V4b sin | Faroles con | sin | Bloques sin farol |
|---|---|---|---|---|---|---|---|---|
| 2 | basico | **44.9%** | 44.9% | 25.4 | 25.4 | 18232 | 18232 | 100% → 100% |
| 2 | avanzado | **44.6%** | 45.0% | 25.5 | 23.8 | 16439 | 19133 | 23% → 0% |
| 2 | pro | **43.9%** | 52.0% | 25.2 | 23.2 | 31616 | 42916 | 30% → 0% |
| 3 | basico | **49.6%** | 49.6% | 25.0 | 25.0 | 129196 | 129196 | 100% → 100% |
| 3 | avanzado | **52.8%** | 52.1% | 25.5 | 24.1 | 57878 | 79813 | 39% → 0% |
| 3 | pro | **48.4%** | 54.3% | 25.5 | 23.4 | 87712 | 135000 | 45% → 0% |
| 4 | basico | **51.9%** | 51.9% | 24.7 | 24.7 | 319933 | 319933 | 100% → 100% |
| 4 | avanzado | **53.6%** | 52.7% | 25.6 | 24.1 | 106455 | 141446 | 35% → 0% |
| 4 | pro | **49.0%** | 53.7% | 25.5 | 23.3 | 131047 | 197240 | 41% → 0% |
| 5 | basico | **51.0%** | 51.0% | 24.7 | 24.7 | 601610 | 601610 | 100% → 100% |
| 5 | avanzado | **52.8%** | 52.9% | 25.4 | 24.1 | 169706 | 229981 | 34% → 0% |
| 5 | pro | **49.1%** | 54.3% | 25.4 | 23.3 | 192882 | 309136 | 40% → 0% |

**V4 en rango: 12/12 con el piso, 12/12 sin él.**

Faroles de ⑥ que el piso frenó, por celda:

| Mesa | Básico | Avanzado | Pro |
|---|---|---|---|
| 2 | 0 | 0 | 14913 |
| 3 | 0 | 0 | 51864 |
| 4 | 0 | 0 | 76008 |
| 5 | 0 | 0 | 110064 |

### D.8 · `soloContraHumano` en Avanzado y Pro — 16 celdas · SÓLO REPORTE

| Mesa | Reto | V7 espejo hoy | …con R-D | V3 mañoso hoy | …con R-D |
|---|---|---|---|---|---|
| 2 | avanzado | 46 | **321** | 40.71% | 40.71% |
| 2 | pro | 41 | **352** | 25.40% | 25.40% |
| 3 | avanzado | 41 | **472** | 57.37% | 63.14% |
| 3 | pro | 40 | **378** | 48.76% | 52.92% |
| 4 | avanzado | 23 | **401** | 57.87% | 58.77% |
| 4 | pro | 25 | **336** | 52.99% | 54.02% |
| 5 | avanzado | 23 | **288** | 50.98% | 49.84% |
| 5 | pro | 28 | **288** | 46.11% | 46.09% |

### D.9 · `farol.bloquePorReto.basico` — 18 celdas (mira V4, V1)

Básico farolea por primera vez: cuánto.

| Bloque | V4 espejo m2·m3·m4·m5 | V4b m2·m5 | sin farol m2·m5 | V1 m2 vict·med | V2 m5 med |
|---|---|---|---|---|---|
| 12 | 46.1% · 52.3% · 54.0% · 54.0% | 25.6 · 24.8 | 100% · 100% | 39.08% · 42 | 27 |
| **15 ·base** | 46.8% · 52.3% · 53.3% · 53.7% | 25.4 · 24.9 | 100% · 100% | 42.58% · 42 | 27 |
| 20 | 47.8% · 51.8% · 54.5% · 53.8% | 25.2 · 24.8 | 100% · 100% | 43.00% · 41 | 27 |

### D.10 · El sondeo que §3.2 no pedía: Básico **por encima** de Avanzado

D.4 deja una tendencia monótona y clara: **cuanto más alto el umbral de
Básico, mejor V3**. El barrido de §3.2 sólo mira por debajo de Avanzado
(−10…−2), así que se sondea el otro lado. Todo con `fraccionPozo` = 0,40.

| Umbral de Básico | Básico m2·m3·m4·m5 | Caída B→P m2·m3·m4·m5 | Mesas ≥ 10 pp | V7 m5 espejo |
|---|---|---|---|---|
| Av-2 {39, 38, 36, 37} | 40.4% · 60.5% · 57.5% · 50.7% | 13.7 · 10.4 · 3.5 · 1.8 | **2/4** | 289 |
| Av+2 {43, 42, 40, 41} | 42.2% · 63.3% · 60.2% · 54.2% | 15.5 · 13.2 · 6.3 · 5.3 | **2/4** | — |
| Av+4 {45, 44, 42, 43} | 40.8% · 64.8% · 60.8% · 55.2% | 14.1 · 14.8 · 6.9 · 6.3 | **2/4** | — |
| Av+6 {47, 46, 44, 45} | 40.9% · 66.9% · 61.1% · 56.4% | 14.2 · 16.9 · 7.2 · 7.6 | **2/4** | 289 |

Referencia con `fraccionPozo` = 0,40: Avanzado 41.2% · 58.4% · 58.0% · 52.1% y Pro 26.7% · 50.0% · 53.9% · 48.9%.

V4 y V4b de Básico bajo `espejo` en los dos extremos del sondeo:

| Umbral | V4 m2·m3·m4·m5 | V4b m2·m3·m4·m5 |
|---|---|---|
| Av-2 | 44.9% · 49.6% · 51.9% · 51.0% | 25.4 · 25.0 · 24.7 · 24.7 |
| Av+6 | 44.9% · 49.6% · 51.9% · 51.0% | 25.4 · 25.0 · 24.7 · 24.7 |

### D.11 · La profundidad, que es lo que sí mueve V1 y V2

**V1** · mesa 2, Básico, `fraccionPozo` 0,40, umbral Av−2. Rango: victorias
60–70 %, mediana 8–20, p10 ≤ 6.

| Entrada | Pila humano · IA | Victorias | Mediana | p10 | Partidas | Cumple |
|---|---|---|---|---|---|---|
| 5× *(base §3.1)* | 500 · 1500 | **6.20%** | 13 | 5 | 4405 | — |
| 15× *(base §3.1)* | 1500 · 2500 | **42.58%** | 42 | 17 | 1752 | — |
| 20× | 2000 · 3000 | **51.39%** | 51 | 20 | 1434 | — |
| 25× | 2500 · 3500 | **59.27%** | 65 | 23 | 1186 | — |
| 30× | 3000 · 4000 | **65.24%** | 77 | 26 | 984 | vict |
| 35× | 3500 · 4500 | **69.29%** | 88 | 31 | 889 | vict |
| 40× | 4000 · 5000 | **73.38%** | 102 | 29 | 804 | — |
| 50× *(base §3.1)* | 5000 · 5000 | **73.23%** | 82 | 18 | 945 | — |

**V2** · mesa 5, los tres retos. Rango: mediana 10–25, p10 ≥ 4.

| Entrada | Básico med·p10 | Avanzado med·p10 | Pro med·p10 | En rango |
|---|---|---|---|---|
| 5× | 8 · 2 | 7 · 2 | 7 · 2 | **0/3** |
| 8× | 14 · 2 | 16 · 2 | 16 · 2 | **0/3** |
| 10× | 18 · 2 | 21 · 2 | 21 · 2 | **0/3** |
| 12× | 24 · 2 | 26 · 2 | 26 · 2 | **0/3** |
| 15× | 27 · 3 | 32 · 3 | 33 · 3 | **0/3** |
| 50× | 34 · 4 | 65 · 5 | 65 · 5 | **0/3** |

### D.12 · V5 (sólo reporte) — el ×10 y las quiebras bajo `espejo`

| Mesa | Reto | ×10 hoy | ×10 con f = 0,40 | Quiebras/mano hoy | …con 0,40 |
|---|---|---|---|---|---|
| 2 | basico | 0.0% | **0.0%** | 0.0000 | **0.0000** |
| 2 | avanzado | 16.3% | **15.7%** | 0.0000 | **0.0000** |
| 2 | pro | 19.8% | **20.0%** | 0.0000 | **0.0000** |
| 3 | basico | 0.0% | **0.0%** | 0.0015 | **0.0016** |
| 3 | avanzado | 20.4% | **20.2%** | 0.0124 | **0.0126** |
| 3 | pro | 24.1% | **24.8%** | 0.0121 | **0.0137** |
| 4 | basico | 0.0% | **0.0%** | 0.0019 | **0.0024** |
| 4 | avanzado | 33.7% | **33.5%** | 0.0322 | **0.0368** |
| 4 | pro | 38.2% | **38.5%** | 0.0319 | **0.0383** |
| 5 | basico | 0.0% | **0.0%** | 0.0026 | **0.0026** |
| 5 | avanzado | 30.2% | **29.6%** | 0.0328 | **0.0432** |
| 5 | pro | 34.9% | **35.5%** | 0.0332 | **0.0469** |

### D.13 · Por qué V1 y V2 no las mueve ninguno de los cinco mandos

`ia.margenPila = 1.000` es una cifra **sellada** de §2.3 y no entra en ningún
barrido, pero es la que reparte las pilas de la mesa real:

| Entrada | Pila del humano | Pila de cada IA | La IA sale con |
|---|---|---|---|
| 5× | 500 | 1500 | **×3.00** |
| 15× | 1500 | 2500 | **×1.67** |
| 50× | 5000 | 5000 | **×1.00** |

## §E · La propuesta (STOP-2)

**Nada de esto está aplicado.** `ajileiConfig.js` sigue en `ee832c39e7e5`, el
blob que STOP-1 dejó. Es el diff que 1c-2-iii escribiría si Victor y el rector
lo aprueban.

### E.1 · El diff de `ajileiConfig.js`

```diff
       porMesa: {
-        // TRABAJO · Avanzado − 8. Lo fija el barrido de 1c-2-ii (§3.2).
-        basico:   { 2: 33, 3: 32, 4: 30, 5: 31 },
+        // SELLADO por 1c-2-ii. Avanzado + 2, y va POR ENCIMA de Avanzado a
+        // propósito: D.4 y D.10 miden que la caída de V3 crece de forma
+        // monótona con el umbral de Básico, y que Básico con umbral BAJO se
+        // vuelve MÁS DIFÍCIL que Avanzado (mesa 4, Av−8: la caída es de 0,2 pp).
+        // En Av+2 Básico sigue comprometiendo fichas —el ×10 es el 6,7–12,5 %
+        // de sus subidas, la mitad de Avanzado— pero deja de ganarle.
+        basico:   { 2: 43, 3: 42, 4: 40, 5: 41 },
         avanzado: { 2: 41, 3: 40, 4: 38, 5: 39 },
         pro:      { 2: 41, 3: 40, 4: 38, 5: 39 },
       },
-    fraccionPozo: { basico: 0.25, avanzado: 0.25, pro: 0.25 },
+    // SELLADO por 1c-2-ii §D.5. De {0,25 · 0,33 · 0,40}, 0,40 es el ÚNICO que
+    // mantiene V4 en rango con R-A activa: 0,25 deja 7 de 12 celdas fuera y
+    // 0,33 deja 6. No es «el menor que sirve», es el único que sirve.
+    fraccionPozo: { basico: 0.40, avanzado: 0.40, pro: 0.40 },
```

**Dos líneas.** Todo lo demás se queda como STOP-1 lo dejó, y cada cosa por su
razón medida:

| Parámetro | Propuesta | La vara que lo justifica |
|---|---|---|
| `subidaFuerte.porMesa.basico` | **Av−8 → Av+2** (`{43,42,40,41}`) | **V3**: la caída B→P pasa de 17,2/7,4/0,2/2,4 a 15,5/**13,2**/**6,3**/**5,3** pp. Y **D-13** aguanta: el ×10 de Básico baja de 14,8–24,8 % a 6,7–12,5 %, la mitad de Avanzado, no cero |
| `subidaFuerte.porMesa` av · pro | **sin cambio** | Sellado en 1d §E. **V6** da bandas +9/+6/+2/+1 y **V7** 16–46 manos |
| `fraccionPozo` (los tres) | **0,25 → 0,40** | **V4**: de 7/12 a **12/12** celdas en rango. Es el único valor de los tres que lo consigue |
| `farol.pisoPuntajePorMesa` | **`{26,28,28,28}` sin cambio** | **V4b**: con piso, el puntaje medio del farol duro es 25,2–25,6; sin piso, 23,2–24,1 (D.7). Mover el piso DENTRO de 24…30 no cambia nada (D.6): lo que pesa es que exista |
| `farol.bloquePorReto.basico` | **15 sin cambio** | Ninguna. D.9: 12, 15 y 20 dan V4 en 46,1/46,8/47,8 % y V2 en 27 manos en los tres |
| `soloContraHumano` | **sin cambio** (sólo Básico) | **V7 no lo pide**: ya está en rango en las cuatro mesas. D.8 lo reporta y no se propone |
| `allIn.puntajeMin`, `pasarConManoGrande`, `desplazamiento` | **sin cambio** | Ninguna vara pidió moverlos |

### E.2 · V1 y V2 con la propuesta, a las tres entradas de la pantalla

**V1** · mesa 2 contra 1 IA Básica. Rango: victorias 60–70 %, mediana 8–20, p10 ≤ 6.

| Entrada | Victorias | Mediana | p10 | p90 | Partidas | Cumple |
|---|---|---|---|---|---|---|
| 5× | 7.62% ±0.39 | **13** | 5 | 46 | 4596 | FUERA |
| 15× **·eval** | 42.22% ±1.16 | **41** | 17 | 113 | 1807 | FUERA |
| 50× | 79.54% ±1.58 | **125** | 43 | 300 | 655 | FUERA |

**V2** · mesa 5 contra 4 IAS. Rango: mediana 10–25 manos, p10 ≥ 4.

| Entrada | Reto | Victorias | Mediana | p10 | Partidas | Cumple |
|---|---|---|---|---|---|---|
| 5× | basico | 28.92% | **5** | 2 | 28218 | FUERA |
| 5× | avanzado | 27.96% | **7** | 2 | 35660 | FUERA |
| 5× | pro | 25.73% | **7** | 2 | 34988 | FUERA |
| 15× **·eval** | basico | 54.17% | **27** | 3 | 19018 | FUERA |
| 15× **·eval** | avanzado | 52.08% | **32** | 3 | 27286 | FUERA |
| 15× **·eval** | pro | 48.85% | **32** | 3 | 26462 | FUERA |
| 50× | basico | 64.13% | **70** | 5 | 11286 | FUERA |
| 50× | avanzado | 56.18% | **64** | 4 | 17806 | FUERA |
| 50× | pro | 55.49% | **66** | 5 | 16162 | FUERA |

### E.3 · V7 con la propuesta

`espejo` a pila = techo (5.000 = 50 × 100). Mínimo: **12 manos**.

| Mesa | Básico | Avanzado | Pro | Cumple |
|---|---|---|---|---|
| 2 | 324 | 46 | 39 | **EN RANGO** |
| 3 | 378 | 41 | 39 | **EN RANGO** |
| 4 | 372 | 19 | 21 | **EN RANGO** |
| 5 **·V7** | 289 | 16 | 18 | **EN RANGO** |

### E.4 · Las siete varas con la propuesta aplicada

**V3** · victorias del `mañoso` a 15×, con R-C:

| Mesa | Básico | Avanzado | Pro | Caída B→P | σ(B,A) | σ(A,P) | Cumple |
|---|---|---|---|---|---|---|---|
| 2 | 42.2% | 41.2% | 26.7% | **15.5 pp** | 0.66 | 9.48 | **EN RANGO** |
| 3 | 63.3% | 58.4% | 50.0% | **13.2 pp** | 5.56 | 10.48 | **EN RANGO** |
| 4 | 60.2% | 58.0% | 53.9% | **6.3 pp** | 4.21 | 8.37 | FUERA |
| 5 | 54.2% | 52.1% | 48.9% | **5.3 pp** | 4.43 | 7.49 | FUERA |

**V4** (farol duro pagado que pierde, 40–55 %) y **V4b** (puntaje medio) bajo `espejo`:

| Mesa | Básico V4·V4b | Avanzado V4·V4b | Pro V4·V4b | En rango |
|---|---|---|---|---|
| 2 | 44.9% · 25.4 | 44.6% · 25.5 | 43.9% · 25.2 | **3/3** |
| 3 | 49.6% · 25.0 | 52.8% · 25.5 | 48.4% · 25.5 | **3/3** |
| 4 | 51.9% · 24.7 | 53.6% · 25.6 | 49.0% · 25.5 | **3/3** |
| 5 | 51.0% · 24.7 | 52.8% · 25.4 | 49.1% · 25.4 | **3/3** |

**12 de 12 celdas de V4 en rango.**

**V6** · aritmética sobre la configuración (R-E: gatea sólo Avanzado y Pro):

| Reto | Umbral −2 | Piso raiseMin+opponentAdj | Banda del ×1 | Cumple |
|---|---|---|---|---|
| Avanzado y Pro | 39 · 38 · 36 · 37 | 30 · 32 · 34 · 36 | **+9 · +6 · +2 · +1** | **EN RANGO** |
| Básico (Av+2) | 41 · 40 · 38 · 39 | 30 · 32 · 34 · 36 | **+11 · +8 · +4 · +3** | **EN RANGO** *(no gatea)* |

**V5** (sólo reporte) · el ×10 y las quiebras bajo `espejo`:

| Mesa | ×10 bás·av·pro | Quiebras/mano bás·av·pro |
|---|---|---|
| 2 | 0.0% · 15.7% · 20.0% | 0.0000 · 0.0000 · 0.0000 |
| 3 | 0.0% · 20.2% · 24.8% | 0.0016 · 0.0126 · 0.0137 |
| 4 | 0.0% · 33.5% · 38.5% | 0.0024 · 0.0368 · 0.0383 |
| 5 | 0.0% · 29.6% · 35.5% | 0.0026 · 0.0432 · 0.0469 |

### E.5 · Lo que la propuesta arregla y lo que no

| | STOP-1 | Con la propuesta | |
|---|---|---|---|
| **V4** | 7 de 12 celdas | **12 de 12** | **ARREGLADA** |
| **V6** | av·pro en rango; Básico −2/−6/−7 | **en rango los tres** (+11/+8/+4/+3 en Básico) | **ARREGLADA** |
| **V7** | en rango (23–46) | **en rango** (16–46) | se mantiene |
| **V3** | 1 de 4 mesas | **2 de 4** (mesas 2 y 3) | mejora, no llega |
| **V1** | fuera | **fuera a las tres entradas** | ver E.6 |
| **V2** | fuera | **fuera a las tres entradas** | ver E.6 |
| **V5** (reporte) | — | ×10 de Básico **0 %**, quiebras 0,0016–0,0026 contra 0,0126–0,0469 de av·pro | R-D a la vista |

### E.6 · Las dos cosas que la propuesta NO puede arreglar, y por qué

**V3 en mesas 4 y 5 no la alcanza ningún valor del umbral.** El barrido completo
—de Av−10 a Av+6, once puntos de recorrido— mueve la caída de mesa 4 entre
**−3,7 y +7,2 pp** y la de mesa 5 entre **0,0 y +7,6 pp**. El mínimo de V3 son 10.
La tendencia es monótona y está saturando: de Av+4 a Av+6, dos puntos más de
umbral compran 0,3 pp en mesa 4 y 1,3 en mesa 5, y a cambio el ×10 de Básico baja
a un cuarto del de Avanzado, que es dejar de cumplir D-13. **Lo que falta no es
un valor: es que Básico se distinga de Avanzado en algo que no sea el umbral de
§6.3.** Hoy se distingue en ②, ③ y ⑥, y en mesas grandes eso no basta.

**V1 y V2 piden dos cosas que viven a profundidades distintas.** Medido con las
pilas de la pantalla (D.11), y es un resultado limpio:

| | Donde entra la primera mitad | Donde entra la segunda |
|---|---|---|
| **V1** | victorias 60–70 % → entre **30× y 35×** | mediana 8–20 → **5×** (y ahí las victorias son el 7,6 %) |
| **V2** | mediana 10–25 → entre **10× y 12×** | p10 ≥ 4 → **50×** (y ahí la mediana es 64–70) |

No hay entrada en la que las dos mitades coincidan, en ninguno de los dos casos.
Y no es cosa de los mandos barridos: **es `ia.margenPila = 1.000`**, una cifra
sellada de §2.3 que no entra en ningún barrido y que decide con cuánta ventaja se
sienta la IA (D.13: ×3,00 a 5×, ×1,67 a 15×, ×1,00 a 50×). V1 y V2 no son varas
mal medidas; son **varas mal escritas**, y hay que reescribirlas por entrada o
renunciar a una de sus dos mitades. Va con la profundidad a **1e**.

### E.7 · Reglas nuevas que los datos piden y que 1c-2-ii no escribe

**R-F · el piso del farol debería mirar el puntaje CRUDO, no `scoreEf`.**
D.7 mide que el piso sí sirve —sube el puntaje medio del farol duro de 23,2–24,1
a 25,2–25,6 y recorta un tercio de los faroles— pero D.6 mide que **moverlo entre
24 y 30 no cambia nada**. Las dos cosas juntas dicen lo mismo: el piso está
saturado porque compara `scoreEf`, que en `BET_3` con lectura de ② viva ya está
inflado por encima de cualquiera de los tres valores. Si el rector quiere que el
piso siga teniendo recorrido, tiene que comparar el puntaje crudo — una línea en
`aiPlayer.js`, en el rango que R-A ya abrió, y un barrido para fijarlo.

**R-G · Básico necesita diferenciarse de Avanzado fuera de §6.3.** Es la mitad
que falta de V3 (E.6). Las candidatas que los datos señalan, sin escribir
ninguna: que Básico no use el bloque de farol en absoluto (hoy lo tiene en 15 y
D.9 dice que el tamaño no cambia nada), o que el `desplazamiento` del
temperamento no se le aplique, o que su `allIn.puntajeMin` siga en `null`
mientras av·pro lo tienen en 31 — que ya es así y no basta.

---

## §F · Aplicado y sellado

### F.1 · El diff de `ajileiConfig.js`

Dos líneas de cifras y una de fórmula, que es lo que el rector selló en STOP-2 y
en la orden de 1c-2-iii. Blob `ee832c39e7e5` → **`f93cc62631d8`**.

```diff
     ia: {
-    margenPila: 1000,
+    factorPila: 1.5,

       porMesa: {
-        basico:   { 2: 33, 3: 32, 4: 30, 5: 31 },   // TRABAJO · Avanzado − 8
+        basico:   { 2: 43, 3: 42, 4: 40, 5: 41 },   // SELLADO · Avanzado + 2
         avanzado: { 2: 41, 3: 40, 4: 38, 5: 39 },
         pro:      { 2: 41, 3: 40, 4: 38, 5: 39 },
       },

-    fraccionPozo: { basico: 0.25, avanzado: 0.25, pro: 0.25 },
+    fraccionPozo: { basico: 0.33, avanzado: 0.33, pro: 0.33 },
```

| Parámetro | Valor sellado | La vara que lo justifica |
|---|---|---|
| `subidaFuerte.porMesa.basico` | `{2:43, 3:42, 4:40, 5:41}` | **V3**, y contra la intuición (D-23): un umbral **alto** hace que Básico empuje menos y lo vuelve **más difícil**. D-13 aguanta: el ×10 de Básico es la mitad del de Avanzado, no cero (F.8) |
| `fraccionPozo` (los tres) | `0.33` | **V4**, con el rango re-escrito a 40–60 %: con 0,33 las doce celdas del espejo entran, y es el **menor** de los tres candidatos, así que no paga el tercio de quiebras de más que costaba 0,40 (D-26, confirmado en F.8) |
| `ia.factorPila` | `1.5` (nuevo) | **V1 y V2**, que con `margenPila` fijo eran incompatibles a toda profundidad (D-27) |
| `pisoPuntajePorMesa` (R-A) | `{2:26, 3:28, 4:28, 5:28}` | Sin cambio. El piso funciona (sube V4b de 23,2–24,1 a 25,2–25,6) pero está saturado dentro de 24…30 → **R-F**, propuesta y no escrita |
| `bloquePorReto.basico` | `15` | Sin cambio: 12, 15 y 20 dan el mismo V4 |
| `soloContraHumano` (R-D) | `{basico: true, …}` | Sin cambio. V7 lo sostiene (F.5) |
| `allIn.puntajeMin`, `pasarConManoGrande`, `desplazamiento` | sin cambio | Ninguna vara pidió moverlos |

### F.2 · La pila de las IAS deja de ser un margen y pasa a ser un factor

`src/engine/entrada.js` (archivo libre) — blob nuevo **`67aa6ce9e899`**:

```diff
 export function pilaIA(entradaHumano, unit, cfg = AJILEI_CONFIG) {
-  const margen = cfg?.ia?.margenPila ?? 0
-  return Math.min(entradaHumano + margen, techoDe(unit, cfg))
+  const factor = cfg?.ia?.factorPila ?? 1
+  return Math.min(Math.round(entradaHumano * factor), techoDe(unit, cfg))
 }
```

`nivelarIA` y `jugadoresVsIA` heredan la fórmula sin tocarse: las dos llaman a
`pilaIA`. Y el banco deja de llevar su propia copia — `nuevaPartida` importa
`entrada.pilaIA` y reparte con ella, que es lo que hace que este cambio llegue a
la simulación sin que nadie se acuerde de venir a actualizarlo.

**Lo que arregla, en una tabla.** Mesa de 100, las tres entradas de la pantalla:

| Entrada | Pila del humano | IA con `margenPila` | IA con `factorPila` | Ventaja antes | Ahora |
|---|---|---|---|---|---|
| 5× · piso | 500 | 1.500 | **750** | ×3,00 | **×1,50** |
| 15× · medio | 1.500 | 2.500 | **2.250** | ×1,67 | **×1,50** |
| 50× · techo | 5.000 | 5.000 | 5.000 | ×1,00 | ×1,00 |

Ésa era la causa de D-27: el mando que más pesaba en V1 y V2 **cambiaba de valor
con la profundidad sin que nadie lo eligiera**. El techo sigue topando, así que
quien entra al techo se sienta exactamente igual que las IAS, como siempre.

**El ejemplo del normativo cambia** y se consigna para la v1.1 (§H): mesa 100,
entra 2.500 → cada IA **3.750** (antes 3.500); entra 4.000 o más → 5.000 topada.
`docs/AJILEI_APU-1_Reglas_v1.0.md` §2.3, §5.3 y la tabla de §10 no se tocan en
esta tanda — la ficha 1c-2 §4 lo manda a la lista del normativo, no al archivo.

### F.3 · L-7 · el sexto verbo de la crónica

`src/hooks/cronicaCore.js`, blob `d6fe61a6069d` → **`d3e8bd6f9950`** (+23
líneas). Es la única edición fuera del motor que el rector autorizó, y cierra
D-20.

```js
if (puesto > 0) {
  if (prev.currentBet === 0) return 'apostar'
  if (n.chips === 0 && n.contrib < prev.currentBet) return 'allIn'
  return puesto > prev.currentBet - p.contrib ? 'subir' : 'igualar'
}
```

**El reconocimiento es exacto, no heurístico.** `pozos.esLegal` sólo permite el
all-in de §4.1 cuando la pila NO cubre lo que falta, así que por construcción el
asiento queda con la pila en cero y la contribución **por debajo** de la apuesta
viva. Ningún otro camino hace eso: el `igualar` que gasta la última ficha llega a
`contrib === currentBet` clavado, y `apostar` y `subir` la dejan por encima. Hay
una prueba para esa distinción exacta, porque es donde estaba el riesgo.

Las tres frases son las del motor al pie de la letra, con la moneda renombrada
donde el motor decía «fichas»:

| Mesa | Humano | IA |
|---|---|---|
| 2 | `Vas all-in con N Heptacoins.` | `La IA va all-in con N.` |
| >2 | `Tú va all-in con N.` | `IA k va all-in con N.` |

**Un detalle de §4.3 que la prueba sacó a la luz.** En la mesa de dos, cuando un
asiento se queda en all-in el rival es el único que puede seguir actuando, así
que la ronda se cierra en el mismo paso y el motor pisa su propia línea con la de
la fase nueva. La crónica hace exactamente lo mismo —manda la fase— y por eso la
equivalencia se conserva; la frase del all-in con moneda sólo se ve en la pieza.
En mesas de tres o más, donde quedan dos que pueden actuar, la línea sí se pinta.

**`testCronica` deja de ser intermitente.** Era el único fichero del banco de
pruebas que jugaba partidas enteras con `Math.random` en las dos fuentes de azar.
Ahora siembra las dos con `mulberry32(23)` —`deck.setRng` y `aiPlayer.setRng`— en
un `beforeEach`, y las devuelve en el `afterEach`. De 10 a **19 pruebas**: las
tres piezas del all-in, cuatro sesiones de 60 manos con las **pilas reales** de
§2.3 a 5×, y una que afirma que el fuzz llega a la rama de §4.1 por su propio pie
—sin ella, una prueba de all-in que nunca produce un all-in saldría verde sin
medir nada—.

### F.4 · El oro, re-derivado

El rector lo pidió «con identidad exacta y sin puertas». Las dos mitades importan
y las dos cambian algo.

**Sin puertas.** Hasta aquí, una divergencia se perdonaba por su CATEGORÍA: «en
este estado existe el all-in defensivo, así que lo que salga vale». Eso, con el
tiempo, es un sello de goma —mientras la divergencia siga cayendo en la
categoría, cualquier cifra futura pasa sin que nadie la vea—. Lo que hay ahora es
una FOTOGRAFÍA: cada decisión que se aparta de la lógica anterior está escrita,
una por línea, con su caso, su antes, su ahora, su multiplicador y su motivo. La
prueba compara contra la lista entera, y el motivo sigue vivo como **etiqueta**,
no como excusa. Vive en `scripts/oro/`, rastreado.

**Identidad exacta incluye el MULTIPLICADOR.** El oro comparaba sólo la ACCIÓN, y
ahí había un agujero del tamaño de §6.3: una Básica que antes subía ×1 y ahora
sube ×10 decía «subir» las dos veces y pasaba por idéntica. La lógica transcrita
subía siempre de una unidad, así que su `k` es 1 por definición y comparar contra
él es legítimo. Con el multiplicador dentro, 1.908 decisiones por semilla dejan
de ser «idénticas».

| | Decisiones | Idénticas | Cambiadas | De ellas, legalidad (1b) | De las cifras de 1c-2 |
|---|---|---|---|---|---|
| `testNivel1 §1` · oro de Básico | 12.672 | 8.160–8.166 | 4.506–4.512 | 2.220 | **2.286–2.292** |
| `testNivel2 §1` · oro doble | 20.736 | 13.557–13.656 | 7.080–7.179 | 3.710–3.742 | resto |

**Las decisiones cambiadas, por regla** (`scripts/oro/nivel1_atribucion_*.txt`,
también selladas). Cada cifra se revierte a su valor de 1d, primero sola y
después acumulando en orden fijo; la marginal suma exactamente lo recuperado:

| Cifra revertida a 1d | dado 0,05 | 0,50 | 0,95 |
|---|---|---|---|
| `porMesa` plano (R-B en su forma vieja) | 0 | 0 | 0 |
| **`subidaFuerte.porReto.basico = false`** | **1.908** | **1.908** | **1.908** |
| **`fraccionPozo.basico = null`** | **384** | **378** | **382** |
| `farol.bloquePorReto.basico = null` | 0 | 0 | 0 |
| sin `farol.pisoPuntajePorMesa` (R-A) | 0 | 0 | 0 |
| sin `soloContraHumano` (R-D) | 0 | 0 | 0 |
| **TOTAL** | **2.292** | **2.286** | **2.290** |

Es el mismo reparto que STOP-2 midió con las cifras provisionales, ahora contra
las selladas: **lo que mueve el oro de Básico es encender §6.3 y bajar el precio
de §6.5**. El bloque de farol, el piso (R-A) y R-D no mueven **ni una decisión**,
y tiene explicación —la batería fija `handCount: 3` en estados sintéticos donde
el sorteo del bloque casi nunca cae, y el humano está siempre vivo, así que R-D
no llega a dispararse—.

**Y la contabilidad del oro se queda** (D-22), apuntando ya a las cifras
selladas. Lo que afirma ahora: al revertir a los valores de 1d, **todo lo que las
cifras movieron vuelve al oro y no aparece ninguna divergencia nueva**. Es decir,
R-A, R-B y R-D siguen siendo retrocompatibles: lo que el oro consigna sale de las
CIFRAS, no del código.

### F.5 · Las bandas, re-selladas

`scripts/apu1_bandas.json` — **84 celdas**, y por primera vez **rastreada**: una
vara que vive en una carpeta ignorada no sobrevive a un `clone`.

| Origen | Celdas | Manos/celda |
|---|---|---|
| `--nivel avanzado --duelo basico` | 20 | 100.000 |
| `--nivel pro --duelo avanzado,basico` | 24 | 100.000 |
| Convergencia (4 mesas × 3 conductores × 3 retos) | 36 | 5.000 |
| **V1 a 50×** (`mesa2 manoso basico`) | 1 | 100.000 |
| **V2 a 15×** (`mesa5 manoso`, los tres retos) | 3 | 100.000 |

Las cuatro últimas son las **bandas de conducta contra humano**, que es lo que
las bandas de NIV-CAL no tenían: hasta hoy toda la vara se medía con las pilas
iguales y hondísimas del banco viejo.

**La clave gana dos segmentos**, y los dos por necesidad. `|e=<entrada>` porque
`mesa2|basico|manoso|j0=basico` existe ahora a 5×, a 15×, a 50× y sin entrada, y
son cuatro medidas distintas. `|n=<manos>` porque la celda de 5.000 manos de la
convergencia y la de 100.000 de la corrida real miden lo mismo con errores muy
distintos, y el rector pidió sellar las dos. Las claves de lo que ya estaba
sellado sin entrada no cambian de forma.

**`--bandas`: VERDE en todo.** 72 corridas, **84 celdas comparadas**, ninguna
fuera de banda, código de salida 0 en las 72. Con `--seed 23` y `--sinReloj` la
reproducción es exacta y la comparación sale a 0σ, que es lo que convierte la
siembra en una vara comprobable.

**`nivCAL_bandas.json` se conserva**, en su sitio y con su nota de **SUPERADA**:
es el único registro de cómo se comportaba la escalera antes de APU-1 —sin
entrada de mesa, sin `pozos.esLegal`, sin las reglas de 1c— y sus celdas ya no se
pueden reproducir con el motor vivo. El banco lee la vara nueva por defecto; a la
vieja sólo se llega con `--vara-bandas`.

### F.6 · Las siete varas con la configuración final

**84 celdas, 100.000 manos cada una, `--seed 23 --sinReloj`, apuesta de mesa 100**
(la profundidad sin entrada son entonces 50×, que es exactamente el techo).
Evidencia: `capturas-dsk/_f1c2/` y `capturas-dsk/1c2F_varas.json`.

| Vara | Rango | Resultado | |
|---|---|---|---|
| **V1** · mañoso vs 1 IA Básica, mesa 2, **50×** | victorias 60–80 % | **75,24 %** ±1,71 · 638 partidas | **EN RANGO** |
| **V2** · mañoso vs 4 IAS, mesa 5, **15×** | mediana 10–35 · p10 ≥ 3 | básico **29**/3 · avanzado **31**/3 · pro **31**/3 | **EN RANGO** |
| **V3** · caída Básico→Pro, mañoso a 15× | ≥ 10 pp | 16,28 · 12,15 · **4,91** · **5,35** pp | **2 de 4** |
| **V4** · faroles pagados que pierden | 40–60 % | **12/12 bajo `espejo`** (46,3–58,5 %) · FUERA contra los otros tres conductores | **ver F.7** |
| **V4b** · puntaje medio del farol duro | reporte | 24,9–25,7 bajo espejo | — |
| **V5** · all-in y quiebras | reporte | F.8 | — |
| **V6** · franja del ×1 | > 0 | básico +11/+8/+4/+3 · av·pro +9/+6/+2/+1 | **EN RANGO** |
| **V7** · espejo mesa 5 | mediana ≥ 12 | básico **266** · avanzado **22** · pro **25** | **EN RANGO** |

**V3, con el instrumento de R-C.** El orden estricto sólo se exige donde el par
se separa 2σ:

| Mesa | Básico | Avanzado | Pro | Caída B→P | σ B-A (gatea) | σ A-P (gatea) | |
|---|---|---|---|---|---|---|---|
| 2 | 40,81 % | 41,44 % | 24,53 % | **16,28 pp** | 0,39 (no) | 11,67 (sí) | EN RANGO |
| 3 | 62,17 % | 59,67 % | 50,02 % | **12,15 pp** | 2,96 (sí) | 12,42 (sí) | EN RANGO |
| 4 | 60,31 % | 59,97 % | 55,40 % | 4,91 pp | 0,63 (no) | 9,74 (sí) | FUERA |
| 5 | 54,78 % | 52,72 % | 49,43 % | 5,35 pp | 4,39 (sí) | 7,65 (sí) | FUERA |

En mesa 2 el orden Básico–Avanzado sale invertido (40,81 < 41,44) pero a 0,39σ:
R-C dice que eso no es una medición y no gatea, que es exactamente para lo que se
escribió.

### F.7 · V4 depende del conductor, y eso no estaba medido (D-30)

STOP-2 eligió `fraccionPozo` con **doce celdas de `espejo`**, porque el barrido
de §3.2 sólo tenía celdas de espejo en ese grupo. Con la matriz entera medida,
V4 sale así:

| Conductor | Mesa 2 | Mesa 3 | Mesa 4 | Mesa 5 |
|---|---|---|---|---|
| **`espejo`** (b/a/p) | 46,8 / 46,3 / 53,5 | 52,3 / 56,4 / 55,1 | 54,4 / 57,8 / 55,9 | 54,1 / 58,5 / 56,3 |
| `pasivo` | 54,5 / 53,0 / 51,1 | 65,1 / 66,4 / 64,5 | **72,4 / 72,2 / 70,3** | **70,7 / 69,2 / 69,7** |
| `aleatorio` | **31,6 / 31,6 / 31,8** | 51,2 / 50,8 / 49,3 | **70,2 / 64,4 / 60,3** | **71,8 / 63,5 / 62,0** |
| `manoso` | **96,7 / 94,5 / 95,1** | 63,7 / 64,5 / 66,6 | **70,9 / 71,6 / 71,8** | **71,2 / 70,2 / 70,8** |

**Las doce del `espejo` entran las doce.** El sello del rector se sostiene sobre
la vara con la que se eligió. Pero fuera del espejo V4 se va por los dos lados, y
la causa no es la IA: **es quién paga**. El `mañoso` sólo paga con 30 puntos o
más, así que cuando paga un farol lo gana casi siempre (96,7 % en mesa 2, sobre
139 pagos de 13.332 faroles); el `aleatorio` de mesa 2 paga con cualquier cosa y
pierde el 68 %. V4 no mide a la IA sola: mide **la pareja (IA, pagador)**, y la
vara no dice contra quién.

Esto no cambia ninguna cifra sellada —el rango que se usó para elegir es el del
espejo, y ahí se cumple— pero sí cambia lo que V4 significa. **Va al rector como
D-30**: o V4 nombra su conductor, o pasa a reporte como V4b y V5.

### F.8 · V5 y D-13 · lo que Básico pone, y lo que cuesta

**D-13 aguanta, que era la condición del rector para subir el umbral.** Reparto
de multiplicadores de la IA contra el `mañoso` a 15× — proporción de subidas de
más de ×1:

| Mesa | Básico | Avanzado | Pro |
|---|---|---|---|
| 2 | **10,17 %** | 14,20 % | 17,72 % |
| 3 | **7,99 %** | 16,02 % | 19,93 % |
| 4 | **14,91 %** | 26,37 % | 30,57 % |
| 5 | **13,77 %** | 24,75 % | 28,65 % |

Básico pone dinero, y pone **alrededor de la mitad** de lo que pone Avanzado. No
cero: eso es lo que D-13 pedía.

**Y bajo `espejo`, Básico pone CERO ×2, ×5 y ×10 en las cuatro mesas** —
2.511.415 subidas de ×1 en mesa 5 y ni una mayor. Es R-D funcionando al 100 %:
sin humano en la mano no empuja, `manosSinHumano` sale 100 % y los 386.537 planes
de farol de mesa 5 se trasladan enteros. Eso es lo que sostiene V7 en 266 manos
donde Avanzado y Pro cierran en 22 y 25.

**El precio de `fraccionPozo`, medido con la cifra sellada.** D-26 avisó de que
0,40 subía las quiebras por mano un tercio. Con 0,33 no:

| Mesa · espejo | 0,25 (1c-2-ii) | **0,33 (sellado)** | 0,40 (descartado) |
|---|---|---|---|
| 4 · avanzado / pro | 0,0322 / 0,0319 | **0,0323 / 0,0333** | 0,0368 / 0,0383 |
| 5 · avanzado / pro | 0,0328 / 0,0332 | **0,0337 / 0,0365** | 0,0432 / 0,0469 |

Elegir el menor de los tres que cumple la vara no fue una preferencia estética:
**compra las doce celdas de V4 sin pagar el tercio de quiebras**. Básico, con
R-D, sigue en 0,0000–0,0026 bajo espejo.

### F.9 · Lo que el sello costó en V3, medido (D-31)

§E prometía V3 en 15,5 / 13,2 / 6,3 / 5,3 pp y lo medido es 16,28 / 12,15 /
**4,91** / **5,35**. La diferencia no es ruido y tiene nombre: **el barrido de
`porMesa.basico` corrió con `fraccionPozo` todavía en 0,25**, porque el grupo B
de §3.2 sólo movía el umbral. Las dos cifras selladas se aplican ahora a la vez,
y **interactúan**. Medido a propósito, con el umbral sellado y la fracción vuelta
a 0,25 (12 celdas, `capturas-dsk/_v3chk/`):

| Mesa | `fraccionPozo` 0,25 | **0,33 (sellado)** | Coste |
|---|---|---|---|
| 2 | 15,36 pp | 16,28 pp | +0,92 |
| 3 | 13,07 pp | 12,15 pp | −0,92 |
| 4 | **7,13 pp** | **4,91 pp** | **−2,22** |
| 5 | **6,18 pp** | **5,35 pp** | −0,83 |

Bajar el precio de §6.5 ayuda más a Pro que a Básico en las mesas grandes, y eso
se come parte de lo que el umbral había ganado. **Ninguno de los dos valores
llega a los 10 pp que V3 pide en mesas 4 y 5**, así que no cambia la decisión —el
hueco es el de siempre, y el rector ya lo mandó a validar en teléfono (1f)— pero
queda escrito que el mando tiene dos efectos y que se pisan.

### F.10 · Varas de cierre

| Vara | Resultado |
|---|---|
| `npm run lint` | **21 problemas** (20 errores, 1 aviso) — **Δ = 0** sobre la línea base |
| `npx vitest run` | **30 archivos, 818 pruebas, 0 fallos**, oro y `testCronica` incluidos |
| Tres corridas seguidas | **818/818 las tres**, sin una sola intermitencia |
| Convergencia | **36 celdas**, 5.000 manos, `--seed 11` · cero «sin converger» · cuatro puertas verdes |
| `--bandas` | **VERDE**, 72 corridas, 84 celdas comparadas, salida 0 |
| `npm run build` | **✓** en 265 ms · `index.js` 618,66 kB (gzip 180,01) |
| `diagDSK o1` | **16/16 `passed`** contra 5173 |
| `diagDSK msg` | **VERDE** contra 5173 · 117 comprobaciones `ok`, ninguna `false`, salida 0 |
| `diagSAL` | **102/102 celdas** |

**Los protegidos.** Seis intactos al blob y tres abiertos, los tres con permiso
escrito:

| Archivo | Blob al abrir 1c-2-iii | Blob al cerrar | |
|---|---|---|---|
| `src/engine/aiPlayer.js` | `8cfc3736cba2` | `8cfc3736cba2` | **INTACTO** — 1c-2-iii no necesitó abrirlo |
| `src/engine/gameEngine.js` | `e4fa160a0acf` | `e4fa160a0acf` | INTACTO (lleva el diff de 1d-i) |
| `src/engine/deck.js` | `eb61426083ca` | `eb61426083ca` | INTACTO (lleva el diff de 1d-i) |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | INTACTO |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | INTACTO |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | INTACTO |
| `src/config/ajileiConfig.js` | `ee832c39e7e5` | **`f93cc62631d8`** | libre · **aplicado** (F.1) |
| `src/engine/entrada.js` | `d84b8d86a14d` | **`67aa6ce9e899`** | libre · **aplicado** (F.2) |
| `src/hooks/cronicaCore.js` | `d6fe61a6069d` | **`d3e8bd6f9950`** | **ABIERTO** — L-7, la única edición fuera del motor autorizada |

`git diff --stat` de los tres del motor, acumulado de toda la campaña APU-1:

```
 src/config/ajileiConfig.js | 144 +++++++++-
 src/engine/aiPlayer.js     | 639 ++++++++++++++++++++++++++++++++++++++-----
 src/engine/deck.js         |  22 +-
 src/engine/gameEngine.js   | 315 ++++++++++++++------
 src/hooks/cronicaCore.js   |  23 ++
```

De ese total, **1c-2-iii aporta 144 líneas de `ajileiConfig.js` y 23 de
`cronicaCore.js` y nada más**: `aiPlayer.js`, `gameEngine.js` y `deck.js` llegan
a STOP-3 con el mismo blob con el que entraron.

**Sin commits.** `git log --oneline -1` sigue en `f9ee503`.

---

## §G · Hallazgos

### Cerrados en esta fase

**D-19 ✓ · el Ajilei de §6.2 entra bajo R-D.** Consignado en STOP-1, decidido por
el rector al abrir 1c-2-ii y **escrito antes de barrer** (B.3), con dos pruebas.

**D-20 ✓ · la crónica ya sabe decir «all-in».** Decidido como **L-7** y escrito
en 1c-2-iii (F.3): sexto verbo en `src/hooks/cronicaCore.js`, reconocido por la
transición y no por `game.message`, y `testCronica` sembrada para que deje de ser
intermitente. De paso salió a la luz un detalle de §4.3 que nadie había medido:
en la mesa de DOS, un all-in cierra la ronda en el mismo paso —el rival es el
único que puede seguir actuando— y la línea se pisa con la de la fase nueva. La
frase con moneda sólo se ve en mesas de tres o más.

**D-21 · CORREGIDO por la medición.** En STOP-1 escribí que el piso de R-A mide
`scoreEf` y no las cartas, y avisé de que V4b lo notaría. El aviso era bueno; la
conclusión que yo apuntaba era **falsa**:

| | V4 | V4b (puntaje medio del farol duro) | Faroles |
|---|---|---|---|
| con piso `{26,28,28,28}` | 43,9–53,6 % | **25,2–25,6** | 16.439–192.882 |
| sin piso (`{0,0,0,0}`) | 44,9–54,3 % | **23,2–24,1** | 19.133–309.136 |

El piso **sí funciona**: sube el puntaje medio del farol entre 1,3 y 2,3 puntos y
recorta hasta un tercio de los faroles (D.7). Lo que no hace es mover V4 —eso lo
arregla `fraccionPozo`, por el lado del que paga, como el rector escribió en §0
de la ficha— y **dentro de 24…30 está saturado** (D.6): los tres valores dan el
mismo V4b. Las dos cosas juntas son **R-F**, propuesta y no escrita.

**D-22 ✓ · la contabilidad del oro se queda.** Tras STOP-3 apunta a las cifras
selladas (F.4) y afirma lo que tiene que afirmar: revertir a 1d devuelve al oro
todo lo que las cifras movieron, y no crea ni una divergencia nueva.

**D-27 ✓ · V1 y V2 estaban mal escritas, y la causa era `ia.margenPila`.** El
rector las re-escribió por entrada —V1 al techo, V2 al medio— y sustituyó el
margen fijo por `ia.factorPila = 1.5`. Con la ventaja de la IA constante a toda
profundidad (F.2), **las dos entran**: V1 75,24 % a 50× y V2 mediana 29/31/31 con
p10 3 a 15×.

### Nuevos, de 1c-2-iii

**D-29 · el puntaje tiene techo, y el umbral de Básico se salió de él.** Un as
vale 11 y ninguna otra carta pasa de 10, así que cuatro cartas del mismo palo
suman **41 como máximo**; con cinco ya es AJILEI y la decisión se va por §6.2,
que es otra rama. El umbral sellado de Básico es 43 en mesa 2 y 42 en mesa 3, de
modo que ahí §6.3 **no se alcanza por puntaje**: sólo entra con el descuento del
temperamento (AGRESIVA −2). No es un fallo —es la forma que toma «empuja menos»
cuando el puntaje va casi de diez en diez— y es lo que hace que el ×10 de Básico
baje a la mitad del de Avanzado sin desaparecer (F.8).

**Y explica la saturación de D-23.** El barrido de once puntos veía V3 subir hasta
~7 pp y detenerse; la razón es que pasado Av+2 el umbral se sale del alcance de la
baraja en más y más mesas, y a partir de ahí subirlo no cambia nada porque la
regla ya está apagada. **Cualquier trabajo futuro sobre el umbral de Básico tiene
que contar con esto**: por encima de 43 no hay recorrido, lo haya en la tabla o
no. Hay dos pruebas nuevas en `testIAAPU1` bloque 2 que lo sellan.

**D-30 · V4 no mide a la IA: mide la pareja (IA, pagador).** STOP-2 eligió
`fraccionPozo` con doce celdas de `espejo` —el barrido de §3.2 sólo tenía espejo
en ese grupo— y ahí las doce entran. Con la matriz entera medida (F.7), V4 se va
por los dos lados según el conductor: el `mañoso` sólo paga con 30 puntos o más,
así que cuando paga un farol lo gana casi siempre (**96,7 %** en mesa 2, sobre 139
pagos de 13.332 faroles), y el `aleatorio` de mesa 2 paga con cualquier cosa y
pierde el **68 %**. La vara, tal como está escrita, no dice contra quién se mide.
**No cambia ninguna cifra sellada** —el rango con el que se eligió es el del
espejo y ahí se cumple— pero sí cambia lo que V4 significa. **Al rector:** o V4
nombra su conductor, o pasa a reporte como V4b y V5.

**D-31 · las dos cifras selladas se pisan en V3.** §E prometía 15,5/13,2/6,3/5,3
pp y lo medido es 16,28/12,15/**4,91**/**5,35**. La diferencia tiene nombre: el
barrido de `porMesa.basico` corrió con `fraccionPozo` todavía en 0,25, porque el
grupo B de §3.2 sólo movía el umbral. Medido a propósito con el umbral sellado y
la fracción vuelta a 0,25 (12 celdas, F.9), mesa 4 da 7,13 pp y mesa 5 6,18: es
decir, **bajar el precio de §6.5 cuesta 2,2 pp de V3 en mesa 4**, porque ayuda más
a Pro que a Básico en las mesas grandes. No cambia la decisión —ninguno de los dos
valores llega a los 10 pp— pero queda escrito que el mando tiene dos efectos.

**Y una lección de método, que es la misma en D-30 y en D-31:** un barrido de un
mando mide ese mando *con los demás en su valor de entonces*. Las dos sorpresas de
esta tanda salieron de aplicar juntas dos cifras que se habían elegido por
separado, y de medir en la matriz entera lo que se había elegido en un rincón de
ella. La tanda que selle varias cifras a la vez debería **re-medir todo con la
configuración final antes de escribir §E**, no después.

### De 1c-2-ii, en pie

**D-23 · el umbral de Básico, cuanto más ALTO, mejor V3 — y es contraintuitivo.**
Un umbral bajo hace que Básico suba fuerte más veces, y eso lo vuelve **más
difícil**, no más fácil: en mesa 4 con Av−8 la caída Básico→Pro era de **0,2 pp** y
con Av−10 se **invertía** (−3,7 pp). La tendencia es monótona en los once puntos
medidos (Av−10 → Av+6) y satura hacia 7 pp en mesas 4 y 5 — por D-29.

**D-24 · bajo `espejo`, el umbral de Básico no cambia NADA.** Las celdas de
`espejo` con Básico salieron **idénticas al dígito** para los seis umbrales
medidos. Es R-D funcionando al 100 %: sin humano en la mesa, el paso 5 no se
evalúa y el umbral es letra muerta. Confirmado con la configuración final: bajo
espejo, Básico hace **2.511.415 subidas de ×1 en mesa 5 y ni una mayor** (F.8).
**Consecuencia práctica:** `porMesa.basico` sólo se puede calibrar contra el
conductor, nunca contra el espejo.

**D-25 · R-D, si se le diera a Avanzado y Pro, multiplicaría V7 por diez.** D.8,
sólo reporte: la mediana del espejo pasa de 23–46 manos a **288–472** en las
cuatro mesas. No se propone —V7 ya está en rango y V3 empeora en mesas 3 y 4—
pero es la medida de cuánto del desgaste de una mesa de IAS viene de §6.3.

**D-26 · el precio de `fraccionPozo`, y por qué 0,33 y no 0,40.** Con 0,40 las
quiebras por mano de Avanzado y Pro subían un tercio en mesas 4 y 5. Medido con la
cifra sellada (F.8), **0,33 no las mueve**: 0,0323/0,0333 en mesa 4 contra los
0,0322/0,0319 de 0,25. Elegir el menor de los tres que cumple la vara compró las
doce celdas de V4 sin pagar ese tercio.

### Abiertos, para el rector

**R-F · el piso del farol debería comparar el puntaje crudo.** Una línea, dentro
del rango que R-A ya abrió, más un barrido. Hoy compara `scoreEf`, que en `BET_3`
con lectura viva ya está inflado por encima de los tres candidatos, y por eso el
piso está saturado. **Propuesta, no escrita.**

**R-G · Básico necesita distinguirse de Avanzado fuera de §6.3.** Es lo que V3
pide en mesas 4 y 5 y ningún valor del umbral puede dar (D-23 + D-29). El rector
lo mandó a validar en teléfono (1f) antes de escribir nada. **Propuesta, no
escrita.**

**D-30 · V4 sin conductor.** Arriba.

**D-12** sigue en 1e, como la ficha dispuso.

---

## §H · Cierre

**STOP-3. Aplicado y sellado. Sin commits.**

### Lo que 1c-2 deja escrito

Tres reglas nuevas en `aiPlayer.js` —**R-A** (piso de puntaje del farol por mesa),
**R-B** (umbral de subida fuerte por reto) y **R-D** (Básico empuja sólo cuando hay
un humano en la mano)—, dos en el banco —**R-C** (el orden estricto de V3 sólo
gatea donde el par se separa 2σ) y **R-E** (V6 no juzga a Básico)— y el **sexto
verbo de la crónica** (L-7). `aiPlayer.js` pasó de 1.289 a 1.445 líneas, 105 de
ellas comentario, y llega a STOP-3 con el mismo blob con el que entró en
1c-2-iii: la última tanda sólo movió cifras.

Cuatro cifras selladas: `porMesa.basico` en Avanzado + 2, `fraccionPozo` en 0,33
para los tres retos, `ia.factorPila` en 1,5 —que sustituye a `ia.margenPila`— y
el rango de V4 re-escrito a 40–60 %, más V1 y V2 re-escritas por entrada.

### Las siete varas, al cerrar

**V1, V2, V6 y V7 en rango. V3 en 2 de 4 mesas. V4 en las doce celdas del espejo
y fuera contra los otros tres conductores (D-30). V4b y V5, reporte.**

### Lo que queda vivo

| Qué | Dónde |
|---|---|
| **V3 en mesas 4 y 5** — 4,91 y 5,35 pp contra los 10 que pide | a validar en **teléfono (1f)**; si el hueco es real, **R-G** |
| **D-30** — V4 no nombra su conductor | decisión del rector |
| **R-F** — el piso del farol debería mirar el puntaje crudo | propuesta, no escrita |
| **D-12** | 1e |
| **§4.3 · enrutado de fases** | 1e |
| La profundidad como mando de diseño (qué entrada ofrece la pantalla por defecto) | 1e |

### Para el normativo v1.1

1. **§2.3 · la pila de las IAS** deja de ser `entrada + MARGEN_IA` y pasa a
   `min( round( entrada × FACTOR_IA ) , techo )`, con `FACTOR_IA = 1,5`. El
   ejemplo cambia: mesa 100, entra 2.500 → cada IA **3.750**; entra 4.000 o más →
   5.000 topada.
2. **§5.3 · el nivelado tras recarga** usa la misma fórmula:
   `max( actual , min( pila_humano_tras_recarga × FACTOR_IA , techo ) )`.
3. **§10 · la tabla de sellados**: `ia.margenPila = 1.000 HC` sale;
   `ia.factorPila = 1,5` entra.
4. **§6.3 · `subidaFuerte.porMesa` es por reto**, forma anidada (R-B). Básico:
   `{2:43, 3:42, 4:40, 5:41}`. La forma plana sigue valiendo como respaldo.
5. **§6.4 · piso de puntaje del farol por mesa** (R-A): `{2:26, 3:28, 4:28, 5:28}`.
   Sin el mapa no hay piso y la conducta es la de 1c.
6. **§6.3, §6.5 y §6.6 · `ia.soloContraHumano`** (R-D): con el reto en `true`, los
   pasos 2, 5, 6 y el multiplicador del Ajilei de §6.2 sólo se evalúan con un
   humano vivo y sin retirar en la mano. Encendido sólo en Básico.
7. **§6.5 · `fraccionPozo` = 0,33** en los tres retos.
8. **La crónica dice «all-in»** (L-7): sexto verbo, con la frase del motor y la
   moneda renombrada en la mesa de dos.
9. **D-29 · el techo de puntaje son 41 puntos** para una mano que no es Ajilei.
   Conviene que el normativo lo diga donde habla de umbrales: por encima de 43 no
   hay recorrido ni con el desplazamiento del temperamento.

### Evidencia

| Qué | Dónde |
|---|---|
| Corridas finales (84 celdas, 100.000 manos) | `capturas-dsk/_f1c2/` · `capturas-dsk/1c2F_varas.json` |
| Convergencia (36 celdas, 5.000 manos) | `capturas-dsk/_conv1c2f/` |
| Aislamiento de D-31 (12 celdas) | `capturas-dsk/_v3chk/` |
| Barridos de 1c-2-ii (238 celdas) | `capturas-dsk/_bar1c2/` · `capturas-dsk/1c2*.json` |
| **Vara de bandas, rastreada** | `scripts/apu1_bandas.json` (84 celdas) |
| Vara de NIV-CAL, superada y conservada | `capturas-dsk/evidencia/nivCAL_bandas.json` |
| **El oro re-derivado, rastreado** | `scripts/oro/nivel1_basico_*.txt` · `nivel1_atribucion_*.txt` · `nivel2_doble_*.txt` |

### Lo que 1c-2 NO hizo

No tocó pantalla, ritmo, textos, `saldo.js` ni `salas.js`. De los hooks, sólo
`cronicaCore.js`, y sólo la edición que el rector autorizó por nombre. No enrutó
fases. No cerró D-12. **No commiteó.**
