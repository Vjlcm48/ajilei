# AJILEI · ARN-3b · Instrumento II: el bucle de autojuego · Informe v1.0

**Fecha:** 2026-10-01 / 02
**Ficha:** `AJILEI_ARN-3b_v1.0.md`
**Punto de partida:** `main` en `c50c36d` (ARN-3a-3). Solo los seis residuos conocidos.
**Alcance:** B5 + B4 + H-1 (`m1`) + H-4 (`rec`, `z1`) + H-13 (`vuelo`) + H-14 (`h1`) + H-3 (`tapetes`) + A-7 + `apu` 360×640 + H-12 + la fusión de `verifyC441b`. **`src/` no se tocó**, tampoco `src/dev/`. Ningún protegido se abrió.
**Dónde se midió:**
- **Línea base:** una copia `git archive c50c36d` con los 75 volcados de B7 y una unión a `node_modules`.
- **«Después»:** el repo, con servidores propios en puertos distintos para ir en paralelo.
- **Controles:** tres copias del árbol de trabajo, cada una con su mutación de producto.

**Reloj:** de 23:51 a 00:47 (56 min de los 120). **Sin commits.**

> **STOP anticipado por D1.** A mitad de la tanda apareció un **rojo del juego**, la puerta `vuelos` de `a2` (§4). Se reporta con su reproducción y **no se arregla**. Desde ese momento no se lanzó nada nuevo. Las corridas que ya estaban en marcha se dejaron terminar para entregar lo medido. **Quedaron sin correr P7-`rec` y P11** (marcados abajo).

## Resumen

| Prueba | Resultado |
|---|---|
| **P1 · `m1`** | **20/20 verdes** (la matriz son 20, con el centinela 1440×850), código 0, sin abortar, 2 039 s. En la Fase 0 abortaba en la 2.ª celda · **Control:** con el navegador hijo matado tras la 1.ª celda, `m1` sale **2** (`✖ el modo abortó: page.click: Target page, context or browser has been closed` · código real 2) |
| **P2 · `a1` T5 1920×937 ×20** | **20/20 verdes**, código 0, origen Δ=0 en las 20. **Pero en ninguna de las 20 quebró una IA** (`mesaReducida: null`): la rama de D3 no se ejercitó en vivo, solo en vitest · **Contraste:** la línea base de HEAD reprodujo el rojo de B4 en esa misma celda (`origen Δ=36.83`, FAIL) |
| **P3 · `a2` sin `SINCERRAR` mudo** | **Verde en lo que pide P3.** 20/20 celdas cerraron todas sus manos: 0 `SINCERRAR`. En HEAD, la misma matriz dio **2 `SINCERRAR` mudos** (T5 1920×937 y T4 1366×768). **Pero `a2` sale con código 1** por el rojo de producto de §4 (T2 1280×720, `vuelos`) |
| **P4 · `h1`** | **16/16 verdes** (código 0; antes 0/16). El peor Δ del ciclo pasa de **10,19 px** (`num`/`chips`) a **0,01 px** en las 16 celdas · **Control:** con la cifra corriéndose 3 px por dígito por la derecha, `h1` sale **rojo**: `cycleStable: false`, peor `num` = 3 px en `h0t0`, código 1 |
| **P5 · `tapetes`** | **Verde** (código 0, antes rojo). **Control:** con «Tricolor Real» a 45 000 en la fuente única de una copia, sigue **verde** (código 0): el arnés sigue el copy, no un literal |
| **P6 · `vuelo`** | **Verde, 2/2 escenarios** (código 0, 162 s; antes rojo y 880 s). Todas las manos cerraron |
| **P7 · `rec` y `z1`** | **`z1`: verde 16/16** (código 0). **`rec`: D4 implementado (reintento ×3 de p7) pero NO CORRIDO** por el STOP |
| **P8 · `apu` 360×640 ×5** | **10/10 verdes**: 5 antes del arreglo y 5 después, todas con código 0. Diagnóstico de los dos patrones rojos de la Fase 0 en §3.5. **Ojo:** en 4 de las 5 corridas nuevas `apu.7` llega «al pago» a los 4–6 ms del clic (H3b-2) |
| **P9 · turno fantasma** | **Verde.** **Control:** con el estado prohibido inyectado en una copia (el panel con turno dice «Se retiró»), la invariante lo ve **151 veces** desde `h0t36` («IA 1 está pensando…» con su panel en «Se retiró»). Celda FAIL, código 1, y toda la geometría en Δ=0 |
| **P10 · líneas base (D9)** | **Verde: 0 diferencias geométricas** en `o1` (10 580 números), `u1` (2 895), `a1` (1 139), `a2` (1 008), `m1` (905) y `h1` (1 616, fuera del arreglo D6), más `f1` (944). Todo lo que cambia depende de la mano jugada. Las dos anclas que se mueven contra HEAD son celdas que en HEAD fueron **mesas reducidas** (`a1` T5 1920×937: 36,83 → 0) o **cobertura incompleta** (`h1` T4/T5 1366×768) |
| **P11 · el resto del arnés** | **NO CORRIDO** por el STOP. Ninguno de esos modos se tocó salvo el veredicto de `apu`/`rec`, que solo se amplía con `cobertura` |
| **P12 · varas** | build limpio · **vitest 1 145/1 145** (1 117 + 28 nuevas, 42 archivos) · **eslint 21** (20 + 1, los mismos tres archivos de `src/`) |

---

## §1 · Los cambios

### 1.1 · Lo puro: `scripts/arnes/juego.mjs` (nuevo, 149 líneas) y `juego.test.js` (nuevo, 28 pruebas)

| Pieza | Línea | Qué decide |
|---|---|---|
| `ORDEN_ACCIONES`, `SIN_PILA`, `elegirAccion()` | `:21-37` | D2. Conserva el orden histórico de los bucles: Pasar, luego Igualar, luego Apostar (el que produjo las líneas base). Con la fila de APU-1 (All-in + Retirarse), pulsa **Retirarse** por defecto: es lo que hacía el reloj a los 20 s, sin esperar, y deja viva la pila. `sinPila: 'allin'` empuja la mano al pago. Una preferencia desconocida es un error, no un silencio |
| `violacionFantasma()` | `:46-53` | D8 (`verifyC441b`): «X está pensando…» con el panel de X en «Se retiró». En mesa 2 la frase es «La IA está pensando…», sin nombre, y basta con que el único rival esté retirado |
| `nuevoJuego()`, `vigilarFotograma()` | `:57-95` | D3 + D8. La mesa se marca reducida **desde el fotograma en que cambia el número de vivos** y se queda marcada. Además cuenta las ceremonias de encogimiento (la vigilancia viva de `verifyShrink`) y anota cada fantasma con su fotograma |
| `causaSinCerrar()` | `:100-111` | D5. Nunca vacía: `mesa-ausente`, `recarga-pendiente`, `sin-pila-sin-contestar`, `humano-con-fila`, `descarte-sin-contestar`, `tope-con-ia-pensando`, `tope` o `sin-fotogramas` |
| `ESTADO`, `INTENTOS_COBERTURA`, `estadoCelda()`, `reintentar()` | `:114-130` | D4: `medida`, `sinCobertura` o `error`, y hasta 3 intentos solo cuando faltó el caso |
| `separarReducida()`, `resumenJuego()` | `:133-149` | D3: lo medido en mesa reducida se aparta, sin perderse. El resumen dice desde dónde, de cuántos a cuántos vivos y cuántos fotogramas |

### 1.2 · El bucle: `scripts/arnes/autojuego.mjs` (nuevo, 159 líneas)

- `LEER` (`:29-56`): una sola lectura del DOM por tick. Trae la recarga (tarjeta, burbuja y motivo), los botones visibles, la fila del humano por `data-accion`, los vivos (`1 + .opp-panel − .opp-eliminating`), la franja «pensando» y los paneles «Se retiró» (también por la vía `.ai-zone`).
- `contestarRecargaComun()` (`:67-82`). Con tarjeta, pulsa «Sí» si se puede y si no «No» (la disciplina de C-0.5). Con burbuja, la toca, que es el gesto del jugador.
- `jugarMano(page, juego, opciones)` (`:100-145`): juega **una** mano. Por cada tick:
  1. espera y aparta el ratón;
  2. lee la mesa;
  3. si hay recarga, la contesta (**H-10**);
  4. si la mesa ya no está, para;
  5. vigila el fotograma (D3, D8);
  6. muestrea con el snap del modo (`muestrear`) y llama al gancho `trasMuestra`;
  7. si ve «Siguiente mano», toma el fotograma de cierre y termina;
  8. si no, elige la acción y la pulsa, llama a `trasAccion` y contesta el descarte.

  Las opciones por defecto son las de los bucles de línea base: 230 ms, 340 vueltas, muestreo 1 de cada 2 y etiquetas `h{mano}t{i}` / `…f`. Si no cierra, devuelve la causa y los últimos 8 fotogramas (D5).
- `siguienteMano()` (`:148-154`): pulsa, espera 1 500 ms y comprueba que la mesa sigue. `marcarReducida()` (`:156`) marca los fotogramas sueltos (`-post`, `-sd`).

### 1.3 · Veredicto con cobertura: `scripts/arnes/nucleo.mjs`

- `VEREDICTOS` y `codigoDeSalida()` (`:36-56`): nuevo veredicto **`cobertura` → código 1**, con su propia etiqueta. El orden de precedencia es error > rojo > cobertura > verde.
- `PORCELDA` (`:151-157`): lee el `estado` de cada celda. Una celda sin cobertura que además tiene un rojo de geometría **sigue siendo roja**.
- `ARRIBA` (`:159-163`): los modos con veredicto arriba declaran sus huecos en `sinCobertura: [...]`.

### 1.4 · `scripts/diagDSK.mjs`

| Modo | Línea | Cambio |
|---|---|---|
| (todos) | `:316-320` | importa el bucle común |
| — | `:4783-4789` | `contestarRecarga` se retira: queda su porqué y el puntero a `contestarRecargaComun` (H-10) |
| — | `:4796-4812` | `notaJuego()` (la línea de log del bucle) y `conCobertura()` (D4: hasta 3 intentos con otra mano) |
| `a1` | `:4948-5112` | celda envuelta en `conCobertura`. Bucle común. **D3:** `states = separarReducida(todos).medidos`. **A-7/D4:** si la línea «Tu mejor palo» no se vio en 3 manos, `sinCobertura` y reintento. **D8:** `sinFantasma` entra en `passed` |
| `a2` | `:6036-6229` | ídem. Los ganchos `trasAccion` hacen el rechequeo de W1 y la selección del descarte. Si la banda no se vio, `bandaSitio` y `cicloVisibility` pasan a `null` (D4). `checks.turnoFantasma` |
| `m1` | `:4673-4700` | **H-1:** el abanico de barajado se mide **antes** del ciclo (después la mesa puede no estar). Bucle común. Mesa reducida aparte. `sinFantasma` |
| `h1` | `:4351-4369`, `:4430-4448` | **D6:** `H1_DERECHA = ['num', 'chips']` y `bboxDeltaDerecha`, que mide borde derecho, y y alto. Solo en el ciclo; la reserva del nombre conserva la caja entera. Bucle común. Mesa reducida aparte. `sinFantasma` |
| `f1` | `:5228-5262` | bucle común. Sus capturas del descarte pasan a ser `trasMuestra` y `trasAccion`. Mesa reducida aparte. `sinFantasma` |
| `o1` | `:4199-4228` | bucle común (280 ms, 60 vueltas, sin fotograma de cierre: `muestraFinal: false`). El óvalo de la mesa reducida queda fuera del Δ y del rango. `passed` con el fantasma |
| `u1` | `:6563-6585` | la mano única pasa al bucle común (`iniciar: false`, las sondas como `trasMuestra`). `checks.turnoFantasma` |
| `z1` | `:5464-5589` | bucle común: la mano solo cierra con «Siguiente mano» montado, o sea con la recarga ya contestada. **`encima`:** qué hay sobre el centro de la carta antes del sobrevuelo. **D4:** sin cartas de cara en 6 manos, «sin cobertura» |
| `vuelo` | `:11460-11520` | **H-13:** bucle común (140 ms, 700 vueltas; `descarte` = descartar hasta 3). La recarga se contesta también en el reintento de «Siguiente mano». `abortadaEn` dice las causas de las tres manos sin cerrar. `checks.turnoFantasma` |
| `tapetes` | `:11030-11036`, `:11169`, `:11245-11262` | **D7:** el precio de la baldosa es `montoTexto(textoCompra(id).precio)` y el diálogo es `textoCompra('tricolor')`: el nombre se lee en su `<strong>` y el monto en la frase. **Sin un solo literal.** Importación **dinámica**: `tapetesCore` importa sin extensión y el gancho de `_resolveExt` no alcanza a los `import` estáticos |
| `rec` | `:13122-13200`, `:13355-13362` | **D4 (H-4):** el caso forzosa se reintenta hasta 3 veces si p7 no tuvo una IA no ganadora con cartas tapadas. `sinCaso`, `estado` e `intentos` por caso, y `sinCobertura` arriba |
| `apu` | `:2654-2710`, `:2946-2955`, `:3043-3062` | **P8:** `apu.7` espera **jugando el descarte** del humano y anota `msHastaPago`. **D4:** si la fila de All-in no se dio, `apu.2`, `apu.7` y `tel.boton4` quedan sin cobertura; si la línea all-in no llegó a verse en 3 mesas, `tel.linea` también. `sinCobertura` por celda y en el modo |

**Los bucles hermanos** que D2 manda anotar para cuando se toquen (`diagDSK.mjs`, siguen con su copia propia):
- `playToShowdown` `:504` (lo usan `r1`/`r2`/`d3`/`b1`)
- `jugarHasta` `:1652` (`apu`: se para ante la recarga a propósito)
- `lineaAllinEnMesa4` `:2290`
- `runTactil` `:3265`, `runP1` `:3371`, `runP2` `:3444`
- `runU2` `:8538`
- `vcHastaVictoria` `:9181`
- `msgJuegaUnaMano` `:10249`
- `luzLlevarAlDescarte` `:11704`
- `revCelda` `:12354`

`recCazar` y `recargaSuave` no son hermanos: miden la recarga y no deben contestarla.

---

## §2 · Las pruebas, con sus cifras

### P1 · `m1`

- `── diagDSK m1 · m1 verde → código 0`, 20/20 celdas, 2 039 s, con 6 modos en paralelo.
- Ninguna mesa se acabó ni se redujo. En 2 celdas el humano pulsó Retirarse.
- **La medida del abanico movida antes del ciclo no cambia una cifra:** `fan` sale idéntico campo por campo contra HEAD (P10).

**Control (lo de ARN-3a no se rompe).** `diagDSK m1 --puerto=5199`. Al terminar la 1.ª celda se mató **solo el Chromium hijo de ese arnés** (PID 56724, padre 32572):

```
T5 1024x768 mazo 40x61 (obj 40x61) ancla (204.73,521) esp x=204.73 (dx -41.27) · hueco 16/16 · Δciclo=0 OK
── diagDSK m1 · error error → código 2
✖ el modo abortó: page.click: Target page, context or browser has been closed
código real 2
```

### P2 · `a1` T5 1920×937, 20 corridas

- **20/20 verdes**, todas con código 0, origen `(655.67, 581.5)` y Δ=0 en todas. Ningún rojo.
- **Ninguna mesa reducida en las 20** (`juego.mesaReducida: null`) y ninguna ceremonia de encogimiento. Con la frecuencia de la Fase 0 (3 de 42, 7 %), cero en 20 es plausible. **P2 se cumple en lo que pide («ningún rojo por mesa reducida»), pero el caso no se dio**: la separación de D3 está probada en `juego.test.js` y no en una mesa viva. Para forzarlo haría falta un molde que haga quebrar una IA en la tercera mano. `allinIA` quiebra en la primera, y eso cambia lo que `a1` mide.
- En 10 de las 20 el humano pulsó Retirarse al menos una vez (`sinPila`). En todas, todas las manos cerraron.

**Contraste en HEAD:** la corrida de línea base dio en esa celda `origen (655.67,581.5) Δ=36.83 · mazo … Δ=36.83 · FAIL`. Es el mismo rojo de B4, la mesa de 5 reducida a 3.

### P3 · `a2`

- **20/20 celdas cerraron todas sus manos: 0 `SINCERRAR`.** En HEAD, la misma matriz dio `banda 0f (1m/0c/SINCERRAR)` en **T5 1920×937** y **T4 1366×768**. Las dos eran mudas: el JSON no decía por qué. Ahora cada celda lleva `juego.sinCerrar` con la causa y los últimos 8 fotogramas; en esta corrida no hubo ninguna.
- **19/20 verdes.** El rojo es T2 1280×720, `FAIL [vuelos]` (`vuelo 609.97 ≤ 605`). **Es del juego**: §4.

### P4 · `h1`

- **16/16 verdes** (código 0). En HEAD, **0/16**: `cycleStable: false` en las 16, peor `num`/`chips` = 10,19 px.
- Hoy el peor Δ del ciclo es **0,01 px** en las 16 celdas, y lo da `tags` o `turno`, no la cifra.
- `numRightFixed`, `growsLeft`, `mesaAligned` y `saldoBlockFixed` no cambian: siguen exigiendo lo suyo.

**Control.** En una copia, `BalanceDisplay.jsx` lleva `marginRight: String(chips).length * 3`. Así la cifra se corre 3 px por la derecha cuando pierde un dígito (1000 → 950). `h1 5 1920x937`: **`cycleStable: false`, `worst: { max: 3, who: "num", tag: "h0t0" }`**, código 1. La puerta sigue sabiendo fallar por el borde que de verdad es ancla.

### P5 · `tapetes`

- **Repo:** `── diagDSK tapetes · tapetes verde → código 0`. En la Fase 0 salía rojo: compra 0/2 por el literal «fichas».
- **Control:** en una copia, `src/config/tapetes.js` dice `nombre: 'Tricolor Real'` y `precio: 45000`. Resultado: **verde, código 0**. Con el arnés viejo, la puerta del diálogo comparaba contra `'¿Comprar Tricolor por ' + montoTexto(50000) + ' fichas?'` y no habría podido seguirlo.

### P6 · `vuelo`

```
vuelo humano m5 1920x1080 · manos=2 · monedas=7 · destino="0" (corroborado "0") · Δ dx=0.26 dy=0.17 · escala decl=1.5 … · OK
vuelo ia     m5 1920x1080 · manos=1 · monedas=7 · destino="3" (corroborado "3") · Δ dx=0.01 dy=0.03 · escala decl=0.666667 … · OK
── VUELO · VERDE (2/2 escenarios) · N=7
```

Todas las manos cerraron (`juego.cerradas` = `manos`). En la Fase 0, el humano abortaba en la mano 7 u 8 con «3 manos sin cerrar». Hoy el humano ganó en la 2.ª mano, así que esta corrida **no recorrió** las manos largas en las que la Fase 0 se atascaba. Que el bucle las cierre lo cubren `a2` (0 `SINCERRAR`) y `f1`, no este escenario.

### P7 · `rec` y `z1`

- **`z1`: 16/16, código 0.** Ninguna celda con `encima` (nada tapó una carta) y ninguna sin cobertura. El rojo de la Fase 0 (T5 1280×720, escala 1) encaja con una tarjeta de recarga que se abría sola a mitad del sondeo. El bucle viejo daba por llegado el pago sin contestarla. **Hipótesis, no demostrada:** en esta corrida no se dio el caso. Si vuelve, el campo `encima` dirá qué tapaba la carta.
- **`rec`: NO CORRIDO** (STOP). El reintento de p7 y `sinCobertura` están escritos y compilan, pero no se ejecutaron. No hay molde en `src/dev/` que fuerce «una IA no ganadora con cartas tapadas». Combinar `capas` con `allinHumano` lo haría probable, pero cambia el escenario de las puertas 3–6, y no se adoptó.

### P8 · `apu` 360×640, 5 corridas

| Tanda | Corridas | Resultado | `apu.7` al pago | `apu.2` intentos | `tel.linea` intentos |
|---|---|---|---|---|---|
| Antes del arreglo (código de HEAD en `apu`) | 5 | **5/5 verdes**, código 0 | — (no se medía) | 1, 1, 1, 1, 2 | 1, 2, 1, 3, 2 |
| Después del arreglo | 5 | **5/5 verdes**, código 0 | 4, 5, 6, 5 y **3 792 ms** | — | — |

**Diagnóstico de los dos patrones rojos de la Fase 0**, leídos en sus JSON:
1. **`apu.2` `logrado: false` tras 4 intentos** (con `apu.7` y `tel.boton4` en cascada). En cuatro mesas nadie abrió por encima de la media apuesta del humano, así que la fila de All-in no existió. **Es instrumento: el caso no se dio.** Arreglo D4: sin cobertura y no rojo.
2. **`apu.7` pulsado, marca puesta, `clavada: "0"` y `alPago: false` a los 30 s.** La mesa da al humano en all-in **sus 20 s para descartar**: `isDiscardTimerActive` (`GameTable.jsx:767`) no mira el all-in. El arnés esperaba de brazos cruzados, así que si las IAs tardaban más de ~10 s en apostar, el pago llegaba pasado el tope. El producto hace lo correcto: espera al jugador y, a los 20 s, lo descarta sin cartas. **Es instrumento.** Arreglo: la espera contesta «Sin descartar».
   - **No demostrado con una reproducción del rojo:** las 10 corridas salieron verdes.
   - En 4 de las 5 nuevas, `APU_EN_PAGO` se cumplió a los 4–6 ms del clic. Eso no es un pago, y significa que esas corridas **no ponen a prueba** la espera (H3b-2).
3. **`tel.linea` `hay: false` tras 3 mesas** (primer rojo de la Fase 0). La línea del humano en all-in solo vive mientras dura la ronda de apuestas: si su All-in la cierra en el acto, no se pinta. **Es instrumento: el caso no se dio.** Arreglo D4.

**Nada de `apu` resultó ser del juego.**

### P9 · turno fantasma

En una copia, `OpponentPanel.jsx:174` dice `isTurn ? 'Se retiró'` en lugar de `'Pensando…'`. `a1 5 1920x937`:

```
T5 1920x937 origen (655.67,581.5) Δ=0 · … · resto Δ=0.02 · TURNO FANTASMA ×151 · FAIL
── diagDSK a1 · a1 rojo → código 1
"fantasmas": [ { "tag": "h0t36", "quien": "IA 1", "pensando": "IA 1 está pensando…" }, …
```

### P10 · líneas base (D9)

Mismo comparador campo por campo que en ARN-3a P1: `ts`, `arnes`, `veredicto` y `codigo` fuera, índices agrupados como `[]`. La línea base es la corrida de **HEAD `c50c36d`** en una copia `git archive`, de esta misma noche y con el mismo Chromium 151.

| Modo | Números | Diferencias | Geométricas | De qué son |
|---|---|---|---|---|
| `a2` | 1 008 | 108 | **0** | recuentos de fotogramas (20) y de vuelos (35), ancho de la banda según su texto (14), y las 2 celdas que en HEAD salían `SINCERRAR` y hoy cierran y miden su banda (de `null` a valor). **1 `maxBottomInZone`**: T2 1280×720, el vuelo del juego (§4) |
| `f1` | 944 | 31 | **0** | `frames` (14), `ciclo.vioDescarte` (9), en qué mano se tomó la selección (6), `ciclo.manos`/`cerradas` (2) |
| `o1` | 10 580 | 131 | **0** | el texto del óvalo en cada fotograma (`realSeq[].text`, 123), sus renglones (5) y 3 celdas con un número distinto de fotogramas. Caja del óvalo, rango y columnas, idénticos |
| `a1` | 1 139 | 62 | **0** en las 15 celdas que en HEAD eran verdes | `frames` (16), el texto de la banda (16) y sus fotogramas (14), qué renglones del cronómetro se muestrearon (`timerDys`, 9, por pertenencia). **T5 1920×937: origen y mazo de 36,83 a 0**. En HEAD fue la mesa reducida (B4); hoy no hubo quiebra |
| `h1` | 1 616 | 121 | **0 fuera de D6** | `cycleStable`/`worst` en las 16 (el arreglo D6: de 10,19 a 0,01), `frames`, ancho de la franja de acción (`centerRange.w`, informativo: la fila con Retirarse es otra), `sawChip`. **T4 1366×768:** `headWorst` 3,62 (`IA 2.cardsY`, `h2-post`) pasa a 0. **T5 1366×768:** `roleCycleOk` de false a true. Las dos son de la mano (en HEAD, con toda probabilidad otra mesa reducida y una ronda «sin rol» que no llegó). No verificado |
| `u1` | 2 895 | 100 | **0** | quién queda encima en cada sonda de apilado y el techo vivo según la mano (`maxZ`, `zTecho`, `zReal`), y qué estados calientes se vieron (`probes`). El mismo tipo que en ARN-3a |
| `m1` | 905 | 25 | **0** | `frames` (20) y en qué fotograma cae el peor del showdown (5). `fan`, mazo, ancla, hueco, flujo y gemelo IA, idénticos |

**Campos nuevos de 3b** (no cuentan como diferencia): `juego`, `sinFantasma`, `estado`, `motivoCobertura`, `intentos` y `checks.turnoFantasma`.

### P11 · el resto del arnés

**No corrido** (STOP de D1). Lo que se tocó y podría afectarles: `nucleo.mjs` amplía `codigoDeSalida` con `cobertura` (las 28 pruebas viejas siguen verdes) y `diagDSK` solo cambia `lob`/`msg` en lo común (imports). `diagPUE`, `diagSAL` y `diagCEL0` no se tocaron.

### P12 · varas

- `vite build`: limpio (el aviso de tamaño de chunk de siempre).
- `vitest`: **42 archivos, 1 145/1 145** (1 117 + 28 de `juego.test.js`).
- `eslint`: **✖ 21 problems (20 errors, 1 warning)**, todos en `CardImage.jsx`, `GameTable.jsx` y `SoundContext.jsx`. Ninguno en `scripts/`.

---

## §3 · H-12, los tres pendientes de REC-1

| Pendiente | Resultado |
|---|---|
| `tel.linea` en `apu` | **Diagnosticado: instrumento** (§2 P8, patrón 3). Pasa a D4. 10/10 verdes en 360×640 |
| El molde `allinHumano` que descuenta mal el saldo | **La causa NO está en `src/dev/`.** La entrada sale del bolsillo en `App.jsx:529` (`saldo − elegida.entrada`, producto). Después, el molde (`siembraAPU.js:98`) sienta al humano con 1,5 apuestas. Para cuadrar, `App` tendría que conocer la entrada sembrada. Con D1 no se arregla aquí. **Aplazado**, con la causa localizada. Solo existe en DEV |
| H-2 de LUZ-1 (el bypass con `'0'`) | **Cerrado: lo resolvió ARN-3a.** Sonda fuera del repo con tres servidores en un proceso, leyendo el `import.meta.env` que Vite inyecta en `src/hooks/useAuth.js` (que hace `Boolean(DEV && VITE_AUTH_BYPASS)`). Resultados abajo |

```
bypass: true (del .env.local)            → VITE_AUTH_BYPASS = "1"  · Boolean(...) = true
bypass: false (ARN-3a: vaciado a '')     → VITE_AUTH_BYPASS = ""   · Boolean(...) = false
'0' en el proceso (el de LUZ-1)          → VITE_AUTH_BYPASS = "0"  · Boolean(...) = true
```

La tercera línea es el control: el arreglo viejo sigue dando bypass encendido.

---

## §4 · STOP por D1: el rojo del juego

**Qué falla.** La puerta 11 de `a2` (DSK-A2, «vuelos por debajo de la banda»): ninguna carta en vuelo dentro de la zona del humano puede bajar del tope de la banda «Tu mejor palo».

**Reproducción (determinista).** Mesa 2, 1280×720, en una mano en la que el humano **se retira**:

| Corridas | Humano retirado | `maxBottomInZone` | Tope de la banda | Puerta |
|---|---|---|---|---|
| 3 con `?apu=allinHumano` (fila All-in/Retirarse asegurada) | sí (`sinPila 1`) | **609,97** las 3 | 605 | **rojo** las 3 |
| La corrida «después» de `a2` | sí (`sinPila 1`) | **609,97** | 605 | rojo |
| 12 de la sonda + 4 con el bucle nuevo + 4 con el bucle viejo de HEAD | no | 590,97 las 20 | 605 | verde |

**Mecanismo, medido.** La carta culpable, en su primer fotograma (`transform: translate(0px, 0px); transition: none`):

```
left 332.734 · top 473 · width 94.0938 · height 132.969 → bottom 609.97 · zona del humano 436–698 · banda 605
```

- Es una **reposición del descarte**: `launchDiscardIn`, `GameTable.jsx:1321-1335`. Nace en la esquina superior izquierda del **mazo del Pie** (`fromX: dr.left, fromY: dr.top`). El mazo del humano a 1280×720 está en y=473: es `M1_PRE['1280x720'].deck.y`.
- Lleva el tamaño de la **ranura de destino** (`w: sr.width, h: sr.height`, la «regla universal: tamaño del destino»), y desde F1 esa ranura mide 94×133.
- Una carta de 133 px de alto que nace en el borde de un mazo de 61 px cuelga **19 px** por debajo de la fila de cartas, sobre la casa de la banda.
- Solo se da cuando las cartas de reposición salen del mazo del humano y el humano no las recibe. Hoy eso es la mano en la que el humano está retirado. (Las reposiciones normales vienen del mazo de la IA y terminan en 590,97.)

**Por qué es del juego y no del instrumento.**
- La carta, su origen y su tamaño los calcula el producto. La sonda los lee tal cual en el primer fotograma.
- La puerta mide la regla que DSK-A2 selló.
- El bucle nuevo no la causa, la **destapa**: pulsa Retirarse cuando la pila no llega. El bucle viejo dejaba que el reloj retirara al humano a los 20 s, que es el mismo camino del producto, pero casi nunca llegaba a él dentro de las manos de `a2`.
- Es, con toda probabilidad, el «`vuelos` intermitente» del cierre de APU-1: T4 1920×937, 773,48 frente a 748,48, +25 px, el mismo sobrante a otra escala (carta de 115 sobre mazo de 47,5).

**Lo que NO se sabe.** Si la regla debe cubrir los vuelos de una fase en la que la banda está oculta (la banda solo vive en el pago y los descartes van antes) es decisión del rector, no del instrumento. Si la regla se queda como está, el arreglo es de producto (`GameTable.jsx`, el origen o el tamaño de `launchDiscardIn`). **No se tocó.**

**Cómo repetirlo** (copia del árbol de trabajo):
- En `gotoMesa`, `page.goto(BASE + '/?apu=allinHumano')`.
- En `a2InstallFlights`, guardar el `className`, el `style` y la caja de la carta que fija el máximo.
- Correr `node scripts/diagDSK.mjs a2 2 1280x720 --puerto=N`. Sale `FAIL [vuelos]` y `vuelo 609.97≤605`, 3 de 3.

---

## §5 · La foto de partida actualizada (los 43 modos de la Fase 0 §A2)

«No corrido» es por el STOP o porque el modo no se tocó en 3b. En esos casos vale el último estado medido (Fase 0 o ARN-3a).

| Modo | Fase 0 | Tras 3b | Nota |
|---|---|---|---|
| `build` | verde | **verde** | P12 |
| `vitest` | rojo en copia limpia (B7) | **1 145/1 145** con volcados | B7 es de 3c |
| `eslint` | 21 | **21** | |
| `banco:verificar` | verde | no corrido | no se tocó |
| `diagPUE todo` | 1.8b + `dis.relevo` | no corrido (P11) | ARN-3a: 1, solo `1.8b` |
| `diagPUE cap` | verde | no corrido (P11) | ARN-3a: 31/31 |
| `diagPUE voz2` | verde | no corrido (P11) | ARN-3a: 222/222 |
| `diagSAL sal` | verde | no corrido (P11) | ARN-3a: 102/102 |
| `diagCEL0 diagnostico` | verde | no corrido (P11) | ARN-3a: 16/16 |
| `diagCEL0 celebracion` | rojo (H-5) | no corrido | 3c |
| `lob` | verde | no corrido (P11) | ARN-3a: 6/6 |
| `retar` | verde | no corrido | no se tocó |
| `gate` | verde | no corrido | no se tocó |
| `p1` · `p2` · `tactil` | verde | no corridos | bucles hermanos anotados |
| `r1` · `r2` | verde | no corridos | `playToShowdown`, hermano anotado |
| `o1` | verde | **verde 16/16** · D9: 0 geométricas | bucle común |
| `o2` | verde | no corrido | no juega manos |
| `a2` | rojo (`SINCERRAR`) | **rojo del juego** (§4), 0 `SINCERRAR` | 19/20 |
| `a1` | verde / 2 rojos en 20 (B4) | **verde 16/16** · T5 1920×937: 20/20 · D9: 0 geométricas | P2 |
| `m1` | **ROTO** (H-1) | **verde 20/20** · D9: 0 geométricas | P1 |
| `h1` | rojo 0/16 (H-14) | **verde 16/16** | P4 |
| `f1` | verde | **verde 16/16** | bucle común. D9: 0 geométricas |
| `z1` | rojo intermitente (H-4) | **verde 16/16** | |
| `u1` | rojo conocido (`hits 0/8`) | **20/20 celdas**, `hits 0/8` (el mismo rojo) · D9: 0 geométricas | aplazado (APU-1 C-1) |
| `menu-movil` · `u2` · `u3` · `vc` | verde | no corridos | no se tocaron |
| `msg` | verde | no corrido (P11) | |
| `tapetes` | **rojo** (H-3) | **verde** | P5 + control |
| `vuelo` | **rojo** (H-13) | **verde 2/2** | P6 |
| `luz` · `rev` | verde | no corridos | H-2 de LUZ-1 cerrado (§3) |
| `rec` | rojo intermitente (H-4) | **no corrido** (STOP) | D4 escrito, sin probar |
| `apu` | rojo intermitente | **360×640: 10/10 verdes** · matriz entera no corrida | P8 · H3b-2 |
| `d1d2` · `d3` · `bug` · `shots` · `b1` | informativos | no corridos | |

---

## §6 · Mapa archivo → commit propuesto

Solo si el rector decide commitear con el STOP de §4 abierto.

| # | Commit | Archivos |
|---|---|---|
| 1 | `ARN-3b-1: núcleo — el bucle de autojuego común y los tres estados de celda` | `scripts/arnes/juego.mjs` · `scripts/arnes/juego.test.js` · `scripts/arnes/autojuego.mjs` · `scripts/arnes/nucleo.mjs` |
| 2 | `ARN-3b-2: arnés — ocho modos sobre jugarMano; h1, tapetes, z1, rec y apu` | `scripts/diagDSK.mjs` |
| — | `src/dev/` | **no se tocó**: no hay commit |
| 3 | `ARN-3b-3: informe de ARN-3b` | `docs/reportes/AJILEI_ARN-3b_Informe_v1.0.md` |

---

## §7 · Hallazgos nuevos (se reportan, no se arreglan)

| ID | Hallazgo |
|---|---|
| **H3b-1** | **El rojo del juego de §4**: la reposición del descarte nace en el mazo del Pie con el tamaño de la ranura y cuelga 19 px (1280×720) o 25 px (1920×937) sobre la casa de la banda. STOP por D1 |
| **H3b-2** | **`apu.7` puede ser un verde falso.** En 4 de 5 corridas, `APU_EN_PAGO` (`diagDSK.mjs:1684`) se cumplió a los 4–6 ms del clic en All-in. Un pago no llega en 5 ms: alguna de sus cuatro vías (`[data-accion="recargar"]`, `[data-accion="recarga"]`, `data-rec-motivo` o «Siguiente mano») ya era verdad. No se averiguó cuál. Hasta entonces, «la mano llega al pago» no está medido |
| **H3b-3** | **El diálogo de compra de tapetes no tiene fuente única.** «¿Comprar **X** por N Heptacoins?» está escrito en el JSX (`TapetesPanel.jsx:115`). El arnés compara ahora el nombre y el monto, que sí salen de `textoCompra`, pero el marco de la frase y la palabra «Heptacoins» no tienen clave en `textos` |
| **H3b-4** | **Los `import` estáticos de `diagDSK` no pasan por `_resolveExt`.** `register()` corre en el cuerpo del módulo, después de resolver los `import` estáticos. Un módulo de `src/` que importe sin extensión solo se puede cargar con `await import()` dentro de la función, como ya hacían `vuelo` y `u2` |
| **H3b-5** | **Con ~20 navegadores a la vez, la ruta al lobby superó una vez los 30 s** (`page.waitForSelector … main.lobby [data-accion="jugar-ia"]`). El arnés salió con **2**, que es lo correcto. Pero el paralelismo tiene techo: las varas de tiempo (`rec`, `dis.relevo`, `cel`) no deberían correr con la máquina así |
| **H3b-6** | **El molde `allinHumano`** descuenta la entrada elegida porque el descuento vive en `App.jsx:529`, fuera de `src/dev/` (§3) |
| **H3b-7** | **La puerta `vuelos` de `a2` mira toda la celda, no solo el instante del vuelo.** `maxBottomInZone` es el máximo de la celda; con la sonda de esta tanda (qué carta, de dónde a dónde) el rojo se explicó en un minuto. Merece quedarse en el arnés cuando el rector decida qué hacer con H3b-1 |

---

## §8 · STOP

**Por qué paró antes.** Por D1. La puerta `vuelos` de `a2` sale roja por el **juego** (§4: la reposición del descarte cuelga 19 px sobre la casa de la banda, 4 de 4 con el humano retirado y 0 de 20 sin él). Se reporta con la reproducción y no se arregla.

**Queda pendiente por el STOP:**
- P7-`rec`: el reintento de p7 está escrito y no se corrió.
- P11 completo: `diagPUE todo`/`cap`/`voz2`, `diagSAL`, `diagCEL0`, `lob` y `msg`.
- La matriz entera de `apu`.
- La averiguación de H3b-2.

**Servidores y navegadores.** Todos los del arnés vivieron dentro de su proceso y murieron con él. La sonda del bypass levantó tres servidores en un solo proceso y los cerró al salir. `netstat` al final, en 4170–4199 y 5100–5329 (todos los puertos que se usaron):

```
(nada escuchando)
```

Los 14 `chrome.exe` que siguen vivos son el Google Chrome del usuario (`C:\Program Files\Google\Chrome\Application\chrome.exe`), no el Chromium del arnés. No se tocaron.

**Copias.** Siguen en `scratchpad/arn3b/` con sus logs y JSON:
- `base`: HEAD `c50c36d` con los volcados;
- `ctl`: P4;
- `ctl_tap`: P5 y la sonda de §4;
- `ctl_fan`: P9.

Sus cuatro uniones a `node_modules` se quitaron con `rmdir`, y el `node_modules` del repo sigue intacto.

**`git status --porcelain`:**

```
 M scripts/arnes/nucleo.mjs
 M scripts/diagDSK.mjs
?? docs/reportes/AJILEI_ARN-3b_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
?? scripts/arnes/autojuego.mjs
?? scripts/arnes/juego.mjs
?? scripts/arnes/juego.test.js
```

Dos archivos modificados, tres nuevos en `scripts/arnes/`, este informe y los seis residuos de siempre. `src/` intacto. Sin `git add`.
