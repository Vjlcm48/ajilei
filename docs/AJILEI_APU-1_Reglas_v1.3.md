# AJILEI · APU-1 · Reglas del dinero y de las IAS · v1.3

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Alcance:** macro 1, Jugar vs IAS. §8 dice lo que hereda el macro 2 (PvP) y §9 lo que necesita el contrato del árbitro de MOT-1.
**Autoridad:** este documento es la única fuente normativa de las reglas de apuesta. Sustituye a la v1.2 (2026-09-26), que se conserva como historia, y a `AJILEI_Modos_y_Asistencia_v1.0.md §3.3` en todo lo que toque dinero. Donde el código y este documento difieran, el código está equivocado.
**Base:** v1.0 más lo sellado en las fases 1b…1f (informes en `docs/reportes/`). Las versiones anteriores se conservan como historia.
**Fecha:** 2026-09-27

---

## Registro de cambios v1.2 → v1.3 (REC-2, 2026-09-27)

Esta versión es la v1.2 íntegra con tres cambios, todos en §5 y todos de la regla híbrida de REC-2 (recarga con saldo insuficiente). Ninguna cifra de §10 se mueve.

- **§5.1:** «Sin saldo no hay pregunta» pasa a «Sin saldo usable no hay pregunta automática ni voluntaria», con la definición de saldo usable y la forzosa de solo salida cuando el saldo usable no llega a una apuesta.
- **§5.2:** «Los inalcanzables se apagan, no se esconden» se conserva mientras al menos un monto quepa en el saldo usable. Si ninguno cabe, la fila se sustituye por un único monto (todo el saldo usable, o lo que falte hasta el techo si es menor). Nunca se ofrece un monto de cero.
- **§5 (final):** línea de trazabilidad hacia el informe de cierre de REC-2.

La v1.2 se conserva sin cambios como historia.

---

## 0. Cómo leer las cifras

- **SELLADO** — decidido por Victor, o fijado por simulación y aceptado por él; no se cambia sin una decisión nueva suya.
- **VIGENTE** — cifra que ninguna vara pidió mover; se implementa como parámetro y puede volver a barrerse.
- Ya no quedan cifras de **TRABAJO** en este documento: las de la v1.0 se fijaron con datos en 1d y 1c-2 (§11), y las de pantalla se validaron en teléfono en 1f.

Todo parámetro se implementa como **parámetro** en `ajileiConfig.js`, nunca como constante suelta, para que el banco pueda barrerlo. La tabla completa está en §10; el cambio respecto a la v1.0, en §13.

---

## 1. Vocabulario

| Término | Significado |
|---|---|
| **Apuesta de mesa** (`unit`) | El monto que el jugador elige en «Retar a las IAS». Es la unidad de todo lo demás. |
| **Ante** | Lo que cada jugador vivo paga al pozo al arrancar cada mano. **Ante = apuesta de mesa.** |
| **Entrada** | Fichas con las que un asiento se sienta. Se descuenta del saldo. Por jugador (`player.entrada`). |
| **Pila** | Fichas de un asiento en un momento dado (`player.chips`). |
| **Piso / Medio / Techo** | Las tres entradas propuestas, como múltiplos de la apuesta de mesa. |
| **Profundidad** | Pila ÷ apuesta de mesa: cuántos antes de fondo. Es el mando que gobierna la duración de una partida (1d, D-14). |
| **Saldo** | Heptacoins de la cuenta, fuera de la mesa. Hasta ECO-1 es `SALDO_PROVISIONAL` (5.000 HC) en `lib/saldo.js`, único sitio que ECO-1 tocará. |
| **Saldo de sesión** | Copia del saldo que vive en `App` mientras dura la sesión: baja al sentarse, sube al levantarse; vuelve a la constante al recargar la página. |
| **Pozo** | Lo apostado en la mano (`state.pot`, entero). Sus **capas** se derivan, no se guardan (`pozos.capasDe`). |
| **Capa** | Porción del pozo que solo pueden ganar quienes contribuyeron hasta ese nivel. |
| **All-in** | Poner toda la pila porque no alcanza para pagar. **Solo defensivo.** Marca `allIn` por jugador. |
| **Pendiente** | Asiento vivo, no retirado, no all-in: el único que puede poner una ficha. |
| **Subida fuerte** | Subir con el mayor multiplicador que la pila permita. |
| **Farol** | Subida fuerte programada por bloque, con o sin cartas. «Farolear es subir; all-in es responder.» |
| **Bloque** | Tramo fijo de manos dentro del cual se sortea la mano del farol. |
| **Puntaje** | Puntos de la mejor suma del mismo palo. Techo **41** para una mano que no es Ajilei (D-29). |

Fases con apuesta: **`BET_1`** (a las 2 cartas), **`BET_2`** (a las 5), **`BET_3`** (tras el descarte).

---

## 2. Entrada y pilas

### 2.1 Ruta de selección — SELLADO

Una sola pantalla, «Retar a las IAS» (§7), con cuatro decisiones:

1. **Reto**: Básico · Avanzado · Pro (`basico` / `avanzado` / `pro`).
2. **Jugadores**: 2 · 3 · 4 · 5 (con la nota del comodín en 4 y 5).
3. **Apuesta de mesa**, según el reto: Básico `50 · 100 · 150 · 250` · Avanzado `100 · 200 · 300 · 500` · Pro `200 · 400 · 600 · 1.000`.
4. **Entrada** (§2.2).

La pantalla **recuerda** reto, jugadores y apuesta; **nunca la entrada**. Cambiar de reto limpia apuesta y entrada (dependen de él) y **conserva el número de jugadores** (E-6, 1e).

### 2.2 Entrada — SELLADO (1f)

- **Piso 10× · Medio 20× · Techo 50×** la apuesta de mesa. La v1.0 decía 5× / 15× / 50×; se subió en 1f porque el piso coincidía con el listón de la recarga automática (§5.1) y «Mínimo» pedía recarga en cuanto se perdía una mano: era una recarga anticipada, no una entrada.

| Mesa | Mínimo 10× | Medio 20× | Techo 50× |
|---|---|---|---|
| 50 | 500 | 1.000 | 2.500 |
| 100 | 1.000 | 2.000 | 5.000 |
| 150 | 1.500 | 3.000 | 7.500 |
| 200 | 2.000 | 4.000 | 10.000 |
| 250 | 2.500 | 5.000 | 12.500 |
| 300 | 3.000 | 6.000 | 15.000 |
| 400 | 4.000 | 8.000 | 20.000 |
| 500 | 5.000 | 10.000 | 25.000 |
| 600 | 6.000 | 12.000 | 30.000 |
| 1.000 | 10.000 | 20.000 | 50.000 |

- La entrada es siempre un **múltiplo entero de la apuesta de mesa**.
- Selector de cuatro chips **sin preselección**: `Mínimo 10×` · `Medio 20×` · `Techo 50×` · `Otra…` (contador de apuesta en apuesta, entre el piso y lo que el saldo permita). Los inalcanzables según el saldo van en gris; **la fila existe siempre con sus cuatro chips** aunque no haya mesa elegida (O1).
- Si el saldo no cubre ni el piso de una mesa, **esa mesa se ofrece en gris** y no se puede escoger.
- El aviso de la pantalla dice **con cuánto se sienta cada IA** antes de pulsar (§2.3).
- La entrada se **descuenta del saldo de sesión** al sentarse.
- **Bono de bienvenida: 2.500 HC.** Con él, un recién llegado entra en mesa 50 con cualquiera de las tres y en mesa 100 con las dos primeras.

### 2.3 Pila de las IAS — SELLADO (1c-2)

```
pila_IA = min( round( entrada_humano × FACTOR_IA ) , techo_de_la_mesa )
FACTOR_IA = 1,5
```

Ejemplo: mesa 100, entra 2.500 → cada IA **3.750**; entra 4.000 o más → 5.000 topada. Quien entra al techo se sienta exactamente igual que las IAS.

Sustituye al «entrada + 1.000» de la v1.0, que sentaba a la IA con ×3 la pila del humano a 5× en mesa 100 y ×5 en mesa 50, y hacía que la ventaja de la IA cambiara con la profundidad sin que nadie la eligiera (D-27). Con el factor la ventaja es constante y **se siente justa** (1f, respuesta 8).

La pila de una IA **nunca se reduce** por regla. Si va por encima de la fórmula tras una recarga (§5.3), no se le quita nada.

### 2.4 Ante por mano — SELLADO

Cada mano cobra **un ante = apuesta de mesa** a cada jugador vivo. La entrada compra la pila; el ante la erosiona; la recarga (§5) existe para eso.

- **Quien no cubre el ante queda fuera**: una IA se va (§6.10); el humano pasa por la recarga forzosa (§5.4). El corte es «menos de un ante», y el residuo (< `unit`) regresa al saldo (§2.5).
- **El ante que deja la pila en cero marca all-in** (1d, D-7): quien paga el ante con su última ficha sigue disputando la mano por sus capas. Y quien abre la ronda salta al all-in (`primerTurno`).

### 2.5 Salida de la mesa — SELLADO

Al abandonar la mesa por cualquiera de las cuatro vías (✕ de cabecera, fin de mesa, recarga forzosa rechazada, pantalla de victoria) **las fichas restantes regresan al saldo de sesión**. Salir estando arriba es legítimo. El resultado se cuenta contra la **entrada**: `fichas − entrada`, con lo recargado contado como dinero **puesto**, no ganado (§5.3).

---

## 3. Apuestas

### 3.1 Multiplicadores — SELLADO

Los cuatro botones son **×1 · ×2 · ×5 · ×10** sobre la apuesta de mesa. El valor es el **incremento** sobre la apuesta viva. La pantalla atenúa el multiplicador cuyo **costo** (no monto) la pila no cubre. Las subidas dentro de una ronda siguen sin límite de número.

### 3.2 Legalidad — SELLADO (L-5)

**El motor valida; la pantalla y la IA consultan.** La única fuente es `pozos.esLegal` / `pozos.accionesDe` (puro, no protegido, importado por el motor), que devuelve el motivo de rechazo: `fuera_de_turno`, `fase_sin_apuesta`, `retirado`, `all_in`, `monto_invalido`, `no_alcanza`, `nada_que_igualar`, `apuesta_viva`, `sin_apuesta_viva`, `accion_desconocida`, `sin_rival`. Una acción ilegal **no se aplica**: el motor devuelve el mismo objeto de estado (`===`) y el motivo. El motor **nunca reescribe una acción en otra**.

La IA elige `k` (§6.2) y la pantalla aplica **el mismo `k` con el que consultó la legalidad**; la traducción de montos a multiplicadores no existe (E-12, 1e).

---

## 4. All-in defensivo y pozos por capas — SELLADO

### 4.1 Cuándo existe

Solo cuando a un jugador **le toca pagar más de lo que tiene**: hay apuesta viva y `pila < lo que falta por igualar`. Sus únicas acciones son **retirarse** o **all-in**. Nadie empuja su pila por voluntad propia cuando alcanza para igualar. El botón **All-in (N)**, con N la pila entera, aparece **solo** en ese caso y **sustituye** a «Igualar»: los dos son excluyentes por construcción.

Un all-in **nunca reabre la ronda** y **nunca termina la mano antes de tiempo**.

### 4.2 Un all-in debe ser respondido — SELLADO (E-13, 1e-iii)

Cuando un asiento se marca all-in, **todo pendiente que aún no haya hablado en la ronda tiene que hablar**: pagar, all-in defensivo si no cubre, o retirarse. La ronda no se cierra por quedar un solo pendiente; se cierra cuando todos los pendientes han actuado e igualado. Hasta 1e-iii el motor cerraba la ronda al marcarse el penúltimo, y el rival escapaba de un all-in sin decidir si lo pagaba. Medido: en la mesa de dos el rival es siempre el último pendiente, y es donde la regla más muerde (E-21).

### 4.3 Pozos por capas

Cada asiento acumula su **contribución total a la mano** (`contribMano`, ante incluido). Las capas se derivan de los niveles de all-in `a_1 < … < a_n`:

```
capa_k            = Σ_i [ min(C_i, a_k) − min(C_i, a_(k−1)) ]      a_0 = 0
elegibles_k       = no retirados con C_i ≥ a_k
capa_superior     = Σ_i [ C_i − min(C_i, a_n) ]
elegibles_superior = no retirados y no all-in
```

Invariantes: la suma de las capas es exactamente el pozo, aritmética entera; nadie gana de otro más de lo que él mismo puso; **una capa sin elegibles devuelve su monto a quien lo puso** (D-7); cada capa se resuelve por separado con el desempate vigente (**la Mano gana**) restringido a sus elegibles; un retirado no es elegible en ninguna capa. `winner` es el ganador de la capa superior; la celebración y el resultado reciben **ganadores por capa**.

### 4.4 Las rondas que no existen — SELLADO (§4.3 al motor, 1e-iii)

**Una ronda de apuesta que no se puede jugar no se abre.** Al entrar en `BET_1`, `BET_2` o `BET_3`, si queda **un pendiente o ninguno**, el motor salta la fase (`abrirApuesta`) exactamente como si todos hubieran pasado. **El descarte y el showdown no se saltan nunca**: el asiento en all-in descarta con normalidad y sus cartas juegan por sus capas. Las cartas se muestran **al final**, nunca antes del descarte, aunque todos estén all-in en `BET_2`. Quien decide si una fase existe es el motor, no la pantalla; la pantalla publica `data-clavada`, que debe valer 0 siempre.

**D-12 · nadie puede hablar.** Dos rutas, cerradas por dos puertas: (1) el ante deja a todos en cero a la vez → se mira **antes de repartir** (`anteDejaAMudos`) y la recarga pasa a forzosa (§5.4); (2) todos all-in apostando en `BET_1` → las fases siguientes no se abren (arriba). Verificado sobre 8.000 manos sembradas con entrada al piso: ninguna fase se abre muda, ninguna mesa se clava, el dinero se conserva.

### 4.5 Voz y marca — SELLADO (L-7, E-23, 1e)

- La crónica tiene **sexto verbo `allIn`**: «Vas all-in con N Heptacoins.» / «La IA va all-in con N.» en mesa de dos; «IA k va all-in con N.» en mesas mayores. Se reconoce por la transición (pila a cero con contribución por debajo de la apuesta viva), no por el mensaje.
- El asiento en all-in va **marcado «ALL-IN»** en su ranura de estado, fuera de flujo, hasta que la mano acaba (orden: retirado → all-in → turno → última acción). Cabe en una línea en todas las mesas y viewports de la casa (relación medida por `diagDSK apu`, no cifra absoluta: E-28).
- El humano en all-in lee **«Estás all-in — tus cartas siguen jugando.»** en el hueco del «pensando». En mesa de dos esa línea no existe nunca: tras responder el rival no queda ronda que abrir.
- Cuando el pozo se parte en capas de distinto dueño, el óvalo lo dice **agrupando por ganador y sumando**: «El pozo se partió: IA 2 se lleva 500.» Se nombra solo lo que el resultado no dice ya; la capa sin elegibles se anuncia como dinero que vuelve.

### 4.6 All-in en PvP

Se escribe una sola vez en el motor puro y `pozos.js`; el macro 2 lo hereda (§8). Va al tutorial con sesión propia.

---

## 5. Recarga entre manos — SELLADO (solo vs IAS)

### 5.1 Las tres formas

Una sola función pura (`pideRecarga`) decide cuál toca:

- **Voluntaria**: botón discreto junto a «Siguiente mano», al cierre de **cada mano a partir de la primera** (no antes de repartir la primera: el jugador acaba de elegir su entrada). La pide el jugador: se abre la tarjeta directamente, **sin burbuja y sin plazo**.
- **Automática**: al cerrar una mano, si `pila_humano < 5 × unit` y el saldo alcanza. Se presenta con la **burbuja** (§5.5). **15 segundos contados desde que termina la revelación** (REC-1), «No recargar» por defecto. Bloquea «Siguiente mano», y la burbuja ocupa su caja (O1).
- **Forzosa**: se evalúa **al cerrar la mano** y, si la mesa está entre manos, también ahí, cuando el humano no cubre el ante **o** cuando el ante dejaría a todos mudos (D-12, ruta 1). Se presenta con la **burbuja** (§5.5), con **el mismo plazo de 15 segundos contado desde que termina la revelación**. Rechazarla o dejar vencer el plazo («Salir con mis fichas») termina la mesa y devuelve las fichas al saldo (§2.5).
- **Nunca dentro de una mano.** **Sin saldo usable no hay pregunta automática ni voluntaria.** Saldo usable es el saldo redondeado hacia abajo a la apuesta de la mesa; el resto se queda en el saldo. Si el saldo usable es menor que una apuesta, la forzosa sí se muestra, como tarjeta de solo salida («Salir con mis fichas»), porque la mesa no puede continuar.

*Nota REC-1: la v1.1 situaba la forzosa «al arrancar una mano» y daba los 15 s solo a la automática. El código siempre la evaluó al cerrar la mano y le dio el mismo plazo; esta versión alinea el texto con el comportamiento.*

### 5.2 Cuánto

La recarga se elige como una entrada: **Mínimo 10× · Medio 20× · Al techo** (lo que falta para llenar la mesa), múltiplos de la apuesta, pila resultante ≤ techo, saldo suficiente. **Los inalcanzables se apagan, no se esconden, mientras al menos uno quepa en el saldo usable.** Si ninguno cabe pero el saldo usable alcanza al menos una apuesta, la fila de montos se sustituye por un único monto: todo el saldo usable, o lo que falte hasta el techo si es menor. Nunca se ofrece un monto de cero. Cuatro validaciones: múltiplo, techo, saldo, entre manos.

### 5.3 Efecto en las IAS

Tras la recarga cada IA viva se **completa hacia arriba** con la misma fórmula de §2.3:

```
pila_IA = max( pila_IA_actual , min( round( pila_humano_tras_recarga × FACTOR_IA ) , techo ) )
```

A la IA que va por encima no se le quita nada; las eliminadas **no vuelven**. `aplicarRecarga` sube pila y `entrada` a la vez, por eso el resultado sigue siendo honesto (§2.5). **La promesa se dice antes de pulsar**, en el subtítulo de la tarjeta, en todas las pantallas: «Quedan {hc} HC. Las IAS se nivelan contigo.» (automática) · «Hasta {hc} HC más. Las IAS se nivelan contigo.» (voluntaria). No hay una nota aparte en escritorio (E-31). El tutorial explica la nivelación una vez (TUT-1).

### 5.4 Lámina — SELLADO (E-14, E-29, REC-1)

- **Forzosa abierta:** bloquea la mesa con velo, porque mientras está abierta la decisión es lo único que importa. **Solo lleva velo cuando está abierta**: mientras es burbuja, la mesa está a la vista (§5.5).
- **Automática y voluntaria:** se apoyan abajo, **sin velo**.
  - **En el teléfono vertical no tocan las cartas del jugador** (0 px²). En 360×640 la automática mide ≤ 163 px y va **sin título**, porque la burbuja ya hizo de encabezado; la voluntaria conserva el suyo.
  - **En escritorio y en el teléfono apaisado pueden cubrir la mano mientras están abiertas.** La automática se pliega con «Ver la mesa», y la voluntaria la abre el jugador cuando ya leyó la mano.
  - Lo único que bloquean es «Siguiente mano».
- **En las dos tarjetas, en todas las pantallas:**
  - el **cronómetro va a la izquierda**;
  - a su derecha, en la misma fila, **«Ver la mesa»** cuando la tarjeta se puede plegar (§5.5).
- **Separaciones:** las de A5 rigen en **todas las pantallas**, es decir, teléfono vertical, teléfono apaisado y escritorio. En el teléfono apaisado la forzosa es compacta, con las dos acciones en fila.
- **Ningún botón de la tarjeta baja del piso táctil de 36 px.** En la forzosa, las acciones miden ≥ 40 px.

### 5.5 La burbuja — SELLADO (REC-1)

La pregunta automática y la forzosa **no se presentan en el instante del resultado**, porque taparían la revelación, que es el momento más importante de la mano.

1. **Cuándo aparece:** al **terminar la revelación**, es decir, cuando aterriza el vuelo de fichas hacia el ganador. En una mano sin vuelo, en el acto. El reloj de 15 s empieza ahí.
2. **Dónde y cómo:** aparece la **burbuja «Recargar»** en la caja de «Siguiente mano», sin mover nada (O1).
   - Lleva el **reloj en un anillo** que se vacía, con los segundos dentro.
   - Lleva un **triángulo de alerta en la forzosa** y la **moneda en la automática**.
3. **Sin velo:** mientras es burbuja no hay velo. La mesa entera queda a la vista y tocable: el jugador puede tocar los nombres para destapar las otras manos (R1/R2).
4. **Un solo reloj:** tocar la burbuja abre la tarjeta **con el tiempo que quede**. Burbuja y tarjeta leen el mismo reloj; abrir o plegar no lo reinicia.
5. **Plegar:** «Ver la mesa» vuelve a convertir la tarjeta en burbuja **mientras queden más de 5 s**.
6. **Los últimos 5 s:** la tarjeta **se abre sola** y queda fija, sin «Ver la mesa». La decisión nunca se toma sin que el jugador la vea.
7. **Al vencer:** lo de §5.1. La forzosa sale con las fichas; la automática se cierra y vuelve «Siguiente mano».
8. **La voluntaria no pasa por burbuja.**

*Lo que el macro 2 hereda: en PvP no hay recarga (§8). Si algún día la hubiera, la burbuja es el molde, porque no detiene la mesa.*

Regla híbrida de REC-2 (2026-09-27). Ver `docs/reportes/AJILEI_REC-2_Cierre_v1.0.md`.

---

## 6. Las IAS

### 6.1 Qué ve una IA — SELLADO

Sus cartas y la información pública: retirados, all-in, contribuciones, pilas, pozo y capas, tamaño del mazo. **Nunca** cartas ajenas ni el mazo. Vigilado por la trampa Proxy de `testNivel2 §8`, extendida a las ramas de APU-1 en los tres retos.

### 6.2 La IA elige monto — SELLADO

`decideBetAction` devuelve `{ action, k, peso }`, `k ∈ {1, 2, 5, 10}`. El motor aplica `k × unit`; la legalidad la consulta en `pozos.js`. `decidirIA` está exportada del motor para que la pantalla mida el `peso` sin gastar azar dos veces (§6.9). **Orden de evaluación**: farol → all-in → trampa armada → subida fuerte → pasar con mano grande → fracción del pozo → lógica de NIV-2.

### 6.3 Subida fuerte por puntaje — SELLADO (1d, 1c-2)

En `BET_2` y `BET_3`, si el puntaje alcanza el umbral de su mesa **y su reto**, sube con el **mayor k que su pila cubra**. Forma anidada por reto (R-B), con la plana como respaldo:

| Mesa | Básico | Avanzado | Pro |
|---|---|---|---|
| 2 | 43 | 41 | 41 |
| 3 | 42 | 40 | 40 |
| 4 | 40 | 38 | 38 |
| 5 | 41 | 39 | 39 |

En `BET_1` la IA sigue reactiva. **D-29:** el puntaje tiene techo **41** (as 11, ninguna otra carta pasa de 10; con cinco del palo es Ajilei y va por su rama). En mesas 2 y 3 el umbral de Básico no se alcanza por puntaje: solo entra con el descuento del temperamento (§6.7), y sus ×10 contra el humano son Ajilei o farol de bloque. Es la forma que toma «empuja menos»: por encima de 43 no hay recorrido. Contra la intuición, un umbral **más alto** hace a Básico **más fácil** (D-23).

### 6.4 Farol por bloques — SELLADO

- Bloques fijos de `B` manos: Básico **15** · Avanzado **12** · Pro **8**. Al inicio de cada bloque se sortea en qué mano ocurre el farol.
- **Quién**: la IA viva de mayor pila (empate: azar), tenga o no cartas.
- **Cómo**: «pone dinero delante» — `apostar` si no hay apuesta viva, `subir` si la hay — con el mayor k que cubra en `BET_2`; en `BET_3` vuelve a subir con lo que cubra; si no cubre ninguna, pasa. Si alguien sube y no puede cubrir, el plan muere y entra §6.6.
- **Piso de puntaje del farol por mesa** (R-A): `{2: 26, 3: 28, 4: 28, 5: 28}`, comparado contra `scoreEf`. Si la elegida no llega al piso, el plan **se traslada** a otra mano del bloque; si era la última, el bloque se queda sin farol. Efecto medido: el puntaje medio del farol duro sube de 23–24 a 25–26 y se recortan un tercio de los faroles. Validado en teléfono: «un farol muy bien jugado» (1f).
- Lectura residual aceptada: la subida fuerte de una IA que no es la de mayor pila es siempre honesta.
- **R-F (parqueada):** el piso podría comparar el puntaje crudo en vez de `scoreEf` para tener recorrido; no se escribe hasta que una prueba en mano lo pida.

### 6.5 Regla de la fracción del pozo — SELLADO

Para **todo pago**, en los tres retos: si lo que la IA debe poner es `≤ 0,33 × pozo actual`, **paga siempre**. Si es mayor, decide por puntaje con su temperamento. `fraccionPozo = 0,33` es el menor de {0,25 · 0,33 · 0,40} que mantiene V4 en rango sin subir las quiebras un tercio (D-26).

### 6.6 All-in de la IA — SELLADO en mecánica; cifras VIGENTES

Cuando la IA no puede cubrir un pago: si `pila ≤ 0,33 × pozo` → **all-in siempre**; si no, all-in solo con `puntaje ≥ 31` (`allIn.puntajeMin`), si no se retira. Ninguna vara pidió mover el 31.

### 6.7 Temperamentos — VIGENTE

`CONSERVADORA / EQUILIBRADA / AGRESIVA / IMPREDECIBLE`, reparto por partida, desplazan **±2** los umbrales de §6.3 y §6.6. La IMPREDECIBLE conserva su ruido.

### 6.8 Pasar con mano grande — SELLADO

Con probabilidad **0 / 0,15 / 0,25** (Básico / Avanzado / Pro) una IA con puntaje sobre el umbral pasa o iguala en `BET_2` y sube fuerte en `BET_3`. Básico nunca arma la trampa.

### 6.9 Ritmo — SELLADO (1e, 1f)

El tiempo de decisión sale de `ui.ritmoIA` por el `peso` que la IA declara: **leve 700–1.000 · media 1.000–1.500 · grande 1.500–2.200 ms**, uniforme dentro de la banda. Es puesta en escena: azar de pantalla, no entra al motor ni al banco. Validado: «las esperas se vieron justificadas» (1f).

### 6.10 IA quebrada — SELLADO

Se va con la ceremonia actual y la mesa sigue con menos. Sus fichas restantes (< un ante) se descartan. Una IA en all-in defensivo **puede resucitar**: en 1f salvó a la última IA de la mesa dos veces; es la regla funcionando.

### 6.11 Reproducibilidad — SELLADO (L-3)

`aiPlayer.js` y `deck.js` tiran de un generador inyectable (`setRng`/`resetRng`, ligado tarde), `Math.random` por defecto. El servidor (MOT-1) inyecta CSPRNG.

### 6.12 Básico empuja solo contra el humano — SELLADO (R-D, 1c-2)

`ia.soloContraHumano = { basico: true }`. Con el reto encendido, el farol de bloque, la subida fuerte, el pasar con mano grande **y el multiplicador del Ajilei** (§6.2) solo se evalúan con un humano vivo y sin retirar en la mano; entre IAS, Básico juega la lógica de NIV-2 a ×1 (con Ajilei sube ×1 y no se retira jamás). El all-in y la fracción del pozo se evalúan siempre: son pagos, no empujes. Efecto: cinco Básicos duran 266 manos bajo espejo en vez de 3; contra el humano Básico pone la mitad del dinero que Avanzado, no cero (D-13). Validado en teléfono: Básico en mesa de cinco «es otra cosa» y se ganó (1f); **R-G no se escribe**.

---

## 7. Pantalla «Retar a las IAS» — SELLADO (1e)

Cuatro filas de chips (reto · jugadores con nota de comodín · apuesta según el reto · entrada `10× / 20× / 50× / Otra…`), un aviso reservado que promete con cuánto se sienta cada IA, y un botón que resume las tres cifras («Retar a 4 IAS · mesa 200 · entras con 4.000»), envolviendo en dos líneas si no cabe. **Mismo componente** que «Armar una mesa» de PvP (`PantallaChips` + `FilaChips`), con la **política de memoria** en `config/memoriaChips.js` como parámetro: PvP recuerda `jugadores · apuesta · tipo`; vs IA recuerda `reto · jugadores · apuesta` y **nunca la entrada**. Lámina: una columna que se aprieta en pantallas anchas, nunca dos. Textos por `t()` con prefijo `ia.`. Sustituyó a `NivelSelect`, `ModeSelect`, `TableSelect` y `STAKE_OPTIONS`.

---

## 8. Lo que hereda el macro 2 (Jugar vs jugador) — sin cambio respecto a la v1.0

Motor y `pozos.js` idénticos. Solo cambian interfaz y base de datos:

- Sin niveles. Siete apuestas: `50 · 100 · 200 · 500 · 1.000 · 2.000 · 5.000`.
- Entrada por jugador fija, dos opciones: **Corta 15×** · **Llena 50×**, en HC. Flujo: jugadores → apuesta → entrada. *(Nota del rector: el Medio de vs IA pasó a 20× en 1f; la Corta de PvP sigue sellada en 15×. Decisión de Victor al abrir el macro 2 si conviene alinearlas.)*
- Identidad de mesa abierta: jugadores × apuesta × entrada. Para sentarse: saldo ≥ entrada.
- Pila en la mesa siempre visible; el saldo total nunca. **Sin recarga.** «Ocultar saldo» del menú: existe sin activar; por decidir si se retira o se reasigna a la billetera.
- Todo §4 aplica idéntico; nada de §5 ni §6.
- Mano de la primera mano: cada jugador elige una carta al azar; gana el nominal más alto (el 12 es el mayor); empate → solo los empatados repiten con las que quedan. Lo ejecuta el servidor.

---

## 9. Lo que el contrato del árbitro de MOT-1 necesita

Sin cambio en las ediciones (APU-1 escribió las 1, 4, 5 y 6 de K-1(a)). Lo nuevo que el árbitro hereda: `pozos.js` con sus once motivos de rechazo; forma del estado (`contribMano`, `allIn`, `entrada` por jugador; `pot` entero con capas derivadas); **`abrirApuesta`** (una fase con ≤ 1 pendiente no se abre); rechazo de acción ilegal devuelto al cliente; recarga como acción que en PvP **no existe**; generador inyectable en `deck.js` y `aiPlayer.js`.

---

## 10. Tabla de parámetros

| Parámetro | Valor | Clase | Dónde vive |
|---|---|---|---|
| Multiplicadores | `[1, 2, 5, 10]` | SELLADO | `betting.multiplicadores` |
| Piso · Medio · Techo de entrada | 10× · 20× · 50× | SELLADO (1f) | `entrada.js` / `betting.entrada` |
| Factor de la pila de las IAS | 1,5 | SELLADO (1c-2) | `ia.factorPila` |
| Bono de bienvenida | 2.500 HC | SELLADO | `salas.js` `BONO_BIENVENIDA` (macro 2) |
| Listón de recarga automática | pila < 5× unit | SELLADO | `betting.recarga.umbral` |
| Plazo de la pregunta | 15 s **desde el fin de la revelación**; al vencer, «No recargar» (automática) o «Salir con mis fichas» (forzosa) | SELLADO (1f, REC-1) | `betting.recarga.plazoMs` |
| Apertura sola de la tarjeta | en los últimos 5 s del plazo; desde ahí, sin plegar | SELLADO (REC-1) | constante de REC-1 en `mesaCore.js` |
| Montos de recarga | 10× · 20× · al techo | SELLADO | derivados de `entrada.js` |
| Umbral de subida fuerte por mesa y reto | Básico {43,42,40,41} · Av/Pro {41,40,38,39} | SELLADO | `ia.subidaFuerte.porMesa.<reto>` |
| `porReto` | los tres encendidos | SELLADO | `ia.subidaFuerte.porReto` |
| Tamaño de bloque de farol | 15 / 12 / 8 | SELLADO | `ia.farol.bloquePorReto` |
| Piso de puntaje del farol por mesa | {26, 28, 28, 28} | SELLADO | `ia.farol.pisoPuntajePorMesa` |
| Fracción del pozo (pago y all-in) | 0,33 | SELLADO | `ia.fraccionPozo.<reto>` |
| Solo contra el humano | `{basico: true}` | SELLADO | `ia.soloContraHumano` |
| Puntaje mínimo de all-in | 31 | VIGENTE | `ia.allIn.puntajeMin` |
| Desplazamiento por temperamento | ±2 | VIGENTE | perfiles de `aiPlayer.js` |
| Pasar con mano grande | 0 / 0,15 / 0,25 | SELLADO | `ia.pasarConManoGrande` |
| Ritmo por peso | 700–1.000 · 1.000–1.500 · 1.500–2.200 ms | SELLADO | `ui.ritmoIA` |
| Pila de pruebas y banco | 5.000 | — | `economy.pilaPruebas` (no es economía del juego) |
| Saldo provisional | 5.000 HC | hasta ECO-1 | `lib/saldo.js` `SALDO_PROVISIONAL` |

---

## 11. Varas y método — SELLADO (1d, 1c-2, 1e-iv)

Las cifras de §6 se fijaron con el banco (`bancoNiveles.mjs`, ~100.000 manos/s, sembrado, cuatro conductores: `espejo`, `pasivo`, `aleatorio`, `mañoso` con la maña de Victor transcrita) contra estas varas:

| Vara | Rango | Dónde se evalúa | Al sellar |
|---|---|---|---|
| **V1** · mañoso vs 1 Básica, mesa 2 | victorias 60–80 % | **50×** | 75,2 % |
| **V2** · mañoso vs 4 IAS, mesa 5 | mediana 10–35 · p10 ≥ 3 | **15×** (re-evaluar a 20× en commits) | 29 / 31 / 31 |
| **V3** · caída Básico→Pro | ≥ 10 pp | 15× | 16,3 · 12,2 · 4,9 · 5,4 (hueco en mesas 4/5 aceptado y validado en mano) |
| **V4** · faroles pagados que pierden | 40–60 % | **bajo `espejo`** (D-30: la vara nombra su conductor) | 12/12 |
| **V6** · franja del ×1 | > 0 | aritmética | en rango |
| **V7** · espejo mesa 5 | mediana ≥ 12 | 50× | 266 / 22 / 25 |

**Oro de Básico** (`scripts/oro/`): fotografía decisión a decisión, con el multiplicador dentro de la identidad, más la contabilidad que demuestra que las divergencias salen de las cifras y no del código. **Bandas** (`scripts/apu1_bandas.json`, rastreado): 84 celdas; desde 1e-iv la clave lleva la **apuesta de mesa**, la siembra y los blobs de los tres archivos que el banco mide, y el lector imprime `VARA DE OTRA ENTRADA` / `VARA DE OTRO MOTOR` / `SIN VARA` con un veredicto de una línea que empieza por `INCOMPARABLE` cuando algo no se pudo comparar (E-24…E-26). Lecciones de método: una tanda que selle varias cifras re-mide todo con la configuración final antes de proponer (D-31); una vara que baja u oscila sin que nadie toque nada se investiga antes de creerla (E-11, E-19); una medida absoluta sin viewport y navegador al lado no es una medida (E-28).

---

## 12. Economía — parqueado en ECO-1

Ganarle a la IA acuña Heptacoins. Aceptado por ahora; la válvula pertenece a ECO-1, igual que persistir el saldo (hoy `SALDO_PROVISIONAL` y un saldo de sesión que muere al recargar la página). Nada de la tienda ni de los torneos puede construirse antes.

---

## 13. Qué cambia respecto a la v1.0

| § | v1.0 | v1.1 | Fase |
|---|---|---|---|
| 2.2 | piso 5× · medio 15× | **10× · 20×** | 1f |
| 2.3 / 5.3 / 10 | `entrada + 1.000` | **`× 1,5`, topado** | 1c-2 |
| 2.4 | — | el ante que deja la pila en cero marca all-in | 1d |
| 3.2 | forma de rechazo por fijar | mismo objeto + once motivos; la pantalla aplica el mismo `k` | 1b, 1e |
| 4.2 | — | **un all-in debe ser respondido por todo pendiente** | 1e-iii |
| 4.4 | «rondas restantes no existen», desde pantalla | **regla del motor** (`abrirApuesta`); D-12 en dos rutas | 1e-iii |
| 4.5 | frase propia del all-in | sexto verbo; marca ALL-IN; línea del humano; **capas agrupadas por ganador** | 1c-2, 1e |
| 5.1 | 10 s | **15 s**; voluntaria desde la primera mano; forzosa también por D-12 | 1e, 1f |
| 5.2 | selector por definir | Mínimo 10× · Medio 20× · Al techo | 1e, 1f |
| 5.3 | — | la promesa en el subtítulo, sin nota aparte | 1f |
| 5.4 | — | forzosa bloquea; automática y voluntaria sin velo | 1e |
| 6.3 | ⟨41/40/36/33⟩ | por reto; Básico {43,42,40,41}; D-29 | 1d, 1c-2 |
| 6.4 | ⟨15/12/8⟩ | sellados; piso R-A; traslado; «pone dinero delante» | 1c, 1c-2 |
| 6.5 / 6.6 | ⟨¼⟩ | **0,33** | 1c-2 |
| 6.9 | ⟨700–2.200⟩ | tres bandas por `peso` | 1e-iii, 1f |
| 6.12 | — | **R-D**, Básico solo contra el humano | 1c-2 |
| 7 | lámina por definir | conserva jugadores al cambiar reto; columna apretada; chips 10/20/50 | 1e, 1f |
| 11 | predicciones | varas selladas; V4 bajo espejo; bandas con entrada, siembra y blobs | 1d, 1c-2, 1e-iv |

### v1.1 → v1.2 (REC-1, 2026-09-26)

- **§5.1:** la forzosa se evalúa al cerrar la mano (y entre manos) y comparte el plazo de 15 s con la automática. El texto se alinea con el código.
- **§5.1 y §5.5:** la automática y la forzosa se presentan con la burbuja y el plazo cuenta desde el fin de la revelación. La voluntaria sigue sin burbuja ni plazo.
- **§5.4:** la forzosa solo lleva velo abierta; cronómetro a la izquierda y «Ver la mesa» en las dos tarjetas; separaciones de A5 en todas las pantallas; piso táctil de 36 px (acciones de la forzosa ≥ 40).
- **§5.5 nuevo:** la burbuja.
- **§10:** plazo desde el fin de la revelación; fila nueva de apertura sola a los 5 s.
- **§5.4 (cierre de la Fase 1):**
  - la cifra «≤ 142,78 px» de A2, que A5 ya había dejado atrás, pasa a «≤ 163 px y 0 px² sobre las cartas» en 360×640;
  - la automática va sin título en el teléfono vertical;
  - en escritorio y en el apaisado, la tarjeta blanda abierta puede cubrir la mano, que se recupera con «Ver la mesa».
