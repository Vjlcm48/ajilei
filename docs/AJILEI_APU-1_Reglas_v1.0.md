# AJILEI · APU-1 · Reglas del dinero y de las IAS · v1.0

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Alcance:** macro 1, Jugar vs IAS. §8 y §9 dicen lo que hereda el macro 2 (PvP) y lo que necesita el contrato del árbitro de MOT-1.
**Autoridad:** este documento es la única fuente normativa de las reglas de apuesta. Sustituye a `AJILEI_Modos_y_Asistencia_v1.0.md §3.3` en todo lo que toque dinero. Donde el código y este documento difieran, el código está equivocado.
**Base del diagnóstico:** `docs/reportes/AJILEI_APU-1_Fase0_Informe_v1.0.md` (2026-09-17). Las citas de línea son a `main` en `f9ee503`.
**Fecha:** 2026-09-17

---

## 0. Cómo leer las cifras

Hay dos clases de números en este documento:

- **SELLADO** — decidido por Victor; no se cambia sin una decisión nueva suya.
- **TRABAJO** — punto de partida para la simulación de la Fase 1d; se fija con datos, no con conversación. Van marcados así: `⟨41⟩`.

La tabla completa de parámetros, con su clase y dónde vivirá en configuración, está en §10. Todo parámetro se implementa como **parámetro**, nunca como constante suelta, para que la simulación pueda barrerlo.

---

## 1. Vocabulario

| Término | Significado | En código hoy |
|---|---|---|
| **Apuesta de mesa** | El monto que el jugador elige en la ruta de selección. Es la unidad de todo lo demás. | `state.unit`, viene de `ModeSelect` como `stake` |
| **Ante** | Lo que cada jugador vivo paga al pozo al arrancar cada mano. **Ante = apuesta de mesa.** | `startHand`, `gameEngine.js:413-418` |
| **Entrada** | Fichas con las que un asiento se sienta a la mesa. Se descuenta del saldo real. | No existe: hoy todos nacen con 5.000 |
| **Pila** | Fichas de un asiento en un momento dado. | `player.chips` |
| **Piso / Techo** | Entrada mínima y máxima, como múltiplos de la apuesta de mesa. | No existe |
| **Saldo real** | Heptacoins de la cuenta, fuera de la mesa. | `saldo_de` (constante hasta ECO-1) |
| **Pozo** | Lo apostado en la mano. Desde APU-1 tiene **capas**. | `state.pot`, escalar |
| **Capa** | Porción del pozo que solo pueden ganar los jugadores que contribuyeron hasta ese nivel. | No existe |
| **All-in** | Poner toda la pila porque no alcanza para pagar. **Solo defensivo.** | No existe: hoy es retiro forzoso (`:255-262`) |
| **Subida fuerte** | Subir con el mayor multiplicador que la pila permita. | No existe para la IA (`:482` pone siempre ×1) |
| **Farol** | Subida fuerte programada, con o sin cartas. | Existe uno en Pro (`aiPlayer.js` ⑥); el de bloques no |
| **Bloque** | Tramo fijo de manos dentro del cual se sortea la mano del farol. | No existe |
| **Puntaje** | Puntos de la mejor suma del mismo palo. | `getBestSuitScore`, `handEvaluator.js` |

Fases con apuesta, por su nombre interno: **`BET_1`** (a las 2 cartas), **`BET_2`** (a las 5 cartas), **`BET_3`** (tras el descarte).

---

## 2. Entrada y pilas

### 2.1 Ruta de selección — SELLADO

Cuatro pasos, en una sola pantalla («Retar a las IAS», §7):

1. **Reto** (nivel): Básico · Avanzado · Pro. IDs de contrato `basico` / `avanzado` / `pro` (`niveles.js:10-13`).
2. **Jugadores**: 2 · 3 · 4 · 5 (con la nota del comodín que ya existe).
3. **Apuesta de mesa**, según el reto: Básico `50 · 100 · 150 · 250` · Avanzado `100 · 200 · 300 · 500` · Pro `200 · 400 · 600 · 1.000` (`niveles.js`, sin cambio).
4. **Entrada**: cuánto del saldo real lleva a esta partida (§2.2).

La pantalla **recuerda** reto, jugadores y apuesta; **nunca recuerda la entrada**. Hoy solo se recuerda el reto (`ajilei.nivel`).

### 2.2 Entrada — SELLADO

- **Piso 5×** y **techo 50×** la apuesta de mesa. Tabla: mesa 50 → 250 / 2.500 · mesa 100 → 500 / 5.000 · mesa 200 → 1.000 / 10.000 · mesa 1.000 → 5.000 / 50.000.
- La entrada es siempre un **múltiplo entero de la apuesta de mesa**.
- Selector de cuatro botones **sin preselección**: `Mínimo 5×` · `Medio 15×` · `Techo 50×` · `Otra…` (contador de apuesta en apuesta, acotado entre 5× y lo que el saldo permita). Los inalcanzables según el saldo real van en gris.
- Si el saldo real no cubre ni el 5× de una mesa, **esa mesa no se puede escoger** en el paso 3.
- La entrada se **descuenta del saldo real** al sentarse. (Hasta ECO-1 el saldo real es una constante; la regla se escribe ahora para que la mesa ya piense en entradas.)
- **Bono de bienvenida: 2.500 HC** (antes 1.200). Razón: es el techo de la mesa más pequeña (50).

### 2.3 Pila de las IAS — SELLADO

```
pila_IA = min( entrada_humano + MARGEN_IA , techo_de_la_mesa )
MARGEN_IA = 1.000 HC   (fijo, no escala con la apuesta)
```

Ejemplo (mesa de 5, apuesta 100, piso 500, techo 5.000): entra con 2.500 → cada IA 3.500; entra con 4.000 o más → todas 5.000. Quien entra al techo se sienta exactamente igual que las IAS.

La pila de una IA **nunca se reduce** por regla (solo por perder). Si una IA va por encima de la fórmula tras una recarga (§5), no se le quita nada.

### 2.4 Ante por mano — SELLADO (convive con la entrada)

Cada mano arranca cobrando **un ante = apuesta de mesa** a cada jugador vivo, exactamente como hoy. La entrada compra la pila; el ante la erosiona mano a mano; la recarga (§5) existe para eso.

**Quien no cubre el ante queda fuera de la mesa** (regla actual `:374-382`, se conserva): una IA se va y la mesa sigue con menos (§6.10); el humano pasa por la pregunta de recarga forzosa (§5.4). Nota del diagnóstico que se conserva a propósito: el corte es «menos de un ante», no «cero», así que un asiento puede irse con hasta `unit − 1` fichas; ese residuo **regresa al saldo real** como cualquier otro resto (§2.5).

### 2.5 Salida de la mesa — SELLADO

Al abandonar la mesa por cualquier vía (✕ de cabecera, fin de mesa, eliminación), **las fichas restantes regresan al saldo real**. Salir estando arriba es legítimo. El resultado de la mesa se calcula contra la **entrada** (`fichas − entrada`), ya no contra 5.000.

---

## 3. Apuestas

### 3.1 Multiplicadores — SELLADO (no se tocan)

Los cuatro botones son **×1 · ×2 · ×5 · ×10** sobre la apuesta de mesa (`GameTable.jsx:1919`). El valor es el **incremento** sobre la apuesta viva de la ronda: «Subir a N» = apuesta viva + k × unit. Se atenúa en gris el que la pila no cubre. Las subidas dentro de una ronda siguen **sin límite de número** (`isRoundOver :113-117`, sin cambio).

### 3.2 Legalidad del monto — SELLADO (L-5)

Desde APU-1 **el motor valida**; la pantalla y la IA solo consultan. Un monto es legal si:

- es entero y mayor que cero;
- para `apostar` y `subir`: es `k × unit` con `k ∈ {1, 2, 5, 10}`, y `pila ≥ lo que cuesta la acción`;
- para `igualar`: `pila ≥ lo que falta por igualar` (si no, la única acción de pago es all-in, §4.1).

Una acción ilegal **no se aplica**: el motor devuelve el estado sin cambios y una señal de rechazo (la forma exacta la fija la tabla de ediciones de la Fase 1a). El motor **nunca reescribe una acción en otra** (hoy reescribe a `retirarse`, `:255-262`; eso desaparece).

La función que decide legalidad y cuánto cuesta cada acción es **una sola**, en `pozos.js` (§9.2), y la usan el motor, la IA y la pantalla. Es la corrección del riesgo R-5 del diagnóstico: hoy el «no cubre» vive en cuatro sitios.

---

## 4. All-in defensivo y pozos por capas — SELLADO

### 4.1 Cuándo existe el all-in

Solo cuando a un jugador (humano o IA) **le toca pagar más de lo que tiene**: hay una apuesta viva y `pila < lo que falta por igualar`. Entonces sus únicas acciones son **retirarse** o **all-in** (poner toda la pila). Nadie puede empujar toda su pila por voluntad propia cuando sí alcanza para igualar o subir. El botón «All-in» aparece **solo** en ese caso, en la fila de acciones, y sustituye a «Igualar».

Un all-in **nunca reabre la ronda**: no es una subida, aunque sea el último en actuar. Un all-in **nunca termina la mano antes de tiempo**.

### 4.2 Pozos por capas

Cada asiento acumula su **contribución total a la mano** (`C_i`, ante incluido). Al cerrar cada ronda el pozo se organiza en capas por los niveles de all-in `a_1 < a_2 < … < a_n` (las contribuciones totales de quienes fueron all-in):

```
capa_k   = Σ_i [ min(C_i, a_k) − min(C_i, a_(k−1)) ]      con a_0 = 0
elegibles_k = jugadores no retirados con C_i ≥ a_k
capa_superior = Σ_i [ C_i − min(C_i, a_n) ]
elegibles_superior = jugadores no retirados y no all-in
```

Consecuencias que deben cumplirse siempre:

- Nadie gana de otro más de lo que él mismo puso. El exceso que nadie pudo igualar vuelve solo a quien lo puso (es la capa superior con un único elegible).
- La suma de las capas es exactamente el pozo. Aritmética entera, sin sobrantes.
- Cada capa se resuelve por separado en el showdown con la regla de desempate vigente (**la Mano gana** recorriendo asientos desde `manoIndex`, `:157-163`), restringida a sus elegibles.
- Un jugador retirado no es elegible en ninguna capa, aunque haya contribuido.

### 4.3 La mano continúa

- El asiento en all-in **descarta** con normalidad (el descarte no toca dinero, `applyDiscard :486-535`) y **se salta en las rondas de apuesta**. Hace falta una **marca propia** por jugador (`allIn`), distinta de `folded`: el retirado pierde el pozo; el all-in compite por sus capas.
- `nextActiveIndex` e `isRoundOver` saltan al all-in igual que al retirado.
- **Si queda un solo jugador con fichas** (ni retirado ni all-in), las rondas de apuesta restantes **no existen**: la mano sigue por reparto y descarte directo al showdown.
- Las cartas se muestran **al final**, nunca antes del descarte, aunque todos estén all-in en `BET_2`.
- El asiento en all-in va **marcado en pantalla** (badge «ALL-IN» en el hueco reservado O1; medir con el modo `o1` del arnés, riesgo R-6).

### 4.4 Anuncio — SELLADO (L-7)

El all-in involuntario tiene **frase propia** en `cronicaCore` (fuera de protegidos). Hoy un retiro forzoso se anuncia como retiro voluntario (hallazgo H-2); eso desaparece con el retiro forzoso.

### 4.5 All-in en PvP

Se escribe **una sola vez**, en el motor puro y `pozos.js`, y el macro 2 lo hereda sin tocarlo (§8). Va al tutorial con sesión propia.

---

## 5. Recarga entre manos — SELLADO (solo vs IAS)

### 5.1 Cuándo

- **Voluntaria**: el jugador la pide entre manos, cuando quiera.
- **Automática**: al terminar una mano, si `pila_humano < 5 × unit` y el saldo real alcanza para recargar, aparece la pregunta. **10 segundos**, por defecto «No recargar». Bloquea «Siguiente mano» (quinta condición del gate `GameTable.jsx:2000`).
- **Nunca dentro de una mano.** Solo entre manos.

### 5.2 Cuánto

La recarga se elige como una entrada: múltiplos de la apuesta de mesa, y **pila resultante ≤ techo de la mesa**. Exige saldo real suficiente. El selector concreto es decisión de lámina (Fase 1e); la regla es esta.

### 5.3 Efecto en las IAS

Tras la recarga cada IA viva se **completa hacia arriba**:

```
pila_IA = max( pila_IA_actual , min( pila_humano_tras_recarga + MARGEN_IA , techo ) )
```

A la IA que ya va por encima no se le quita nada. Las IAS ya eliminadas **no vuelven**. Es el «segundo round» para el jugador y para las IAS casi quebradas; alarga la sesión y, con ella, la publicidad entre manos (decisión de producto, no efecto colateral).

### 5.4 Humano que no cubre el ante

Si al arrancar una mano el humano no cubre el ante, la pregunta de recarga es **forzosa** (misma pantalla, mismo plazo). Si no recarga, la mesa termina con la pantalla de resultado. Hoy ese caso lo cubre un modal con dos «Próximamente» (`GameTable.jsx:2236-2257`): esa es la superficie que se reemplaza. Esto exige la edición 5 de MOT-1 (quebrar no termina la mesa desde el motor, `:399-406`).

---

## 6. Las IAS

### 6.1 Qué ve una IA — SELLADO

Sus propias cartas y la información **pública**: quién se retiró, quién está all-in, contribuciones, pilas, pozo y sus capas, tamaño del mazo. **Nunca** las cartas ajenas ni el contenido del mazo. El diagnóstico lo verificó (C-2); toda rama nueva queda bajo la trampa Proxy de `testNivel2.test.js §8`, extendida.

### 6.2 La IA elige monto — SELLADO (capacidad nueva)

`decideBetAction` devuelve `{ action, k }` con `k ∈ {1, 2, 5, 10}` cuando la acción es `apostar` o `subir`. El motor aplica `k × unit` en lugar del ×1 fijo de hoy (`:482`). La legalidad la consulta en `pozos.js` como todo el mundo.

### 6.3 Subida fuerte por puntaje — cifras de TRABAJO

En `BET_2` y `BET_3`, si el puntaje de la IA alcanza el umbral de su mesa, sube con el **mayor k que su pila cubra**:

| Mesa | Umbral |
|---|---|
| 2 | `⟨41⟩` |
| 3 | `⟨40⟩` |
| 4 | `⟨36⟩` |
| 5 | `⟨33⟩` |

Aplica en los tres retos. En `BET_1` la IA sigue **reactiva** (con dos cartas no hay puntaje que justifique). Los umbrales se desplazan por personalidad (§6.7). Observación de campo que la simulación debe contrastar: es mucho más fácil sacar 40 en mesa de dos que en mesa de cinco, y se han ganado y perdido mesas de cinco con 21. Nota del diagnóstico: hoy el código suma `+2` de cautela por rival extra en los umbrales de apertura (`aiPlayer.js:709-718`); no es contradicción (abrir no es subir fuerte), pero la simulación decide la relación entre ambos.

### 6.4 Farol por bloques — SELLADO en mecánica, TRABAJO en tamaño

- La partida se divide en **bloques fijos** de `B` manos: Básico `⟨15⟩` · Avanzado `⟨12⟩` · Pro `⟨8⟩` (manos 1–B, B+1–2B, …). Al **inicio de cada bloque** se sortea en qué mano del bloque ocurre el farol.
- **Quién**: la IA viva de **mayor pila** en el momento de ejecutarlo (empate: azar). Farolea **tenga o no buenas cartas**; cuenta como farol igual.
- **Cómo**: en `BET_2` sube con el mayor k que su pila cubra; en `BET_3` vuelve a subir con lo que cubra (aunque sea ×1); si no cubre ninguna subida, pasa. **Farolear es subir; all-in es responder**: si alguien sube y la farolera no puede cubrir, el plan del farol muere y entra la regla del all-in de la IA (§6.6).
- Si solo queda una IA y va corta de pila, la regla se aplica igual.
- Lectura residual aceptada: la subida fuerte de una IA que **no** es la de mayor pila es siempre honesta. Si algún día se nota, la mitigación es de una línea (cualquier IA viva puede ser la elegida, con más peso para la rica).

### 6.5 Regla del cuarto del pozo — SELLADO en mecánica, TRABAJO en la fracción

Para **todo pago** (igualar), en todos los retos: si lo que la IA debe poner es `≤ ⟨¼⟩ del pozo actual`, **paga siempre**, sin mirar cartas. Si es mayor, decide por puntaje con los umbrales de su temperamento. Sustituye la matemática de bote de Avanzado+ (`pagaElBote`, `aiPlayer.js:759-767`) como criterio único; la equidad de mano deja de intervenir en el pago.

### 6.6 All-in de la IA — SELLADO en mecánica, TRABAJO en cifras

Cuando la IA no puede cubrir un pago (§4.1):

- si `pila ≤ ⟨¼⟩ del pozo` → **all-in siempre**, sin mirar cartas;
- si `pila > ¼ del pozo` → all-in solo con `puntaje ≥ ⟨31⟩`; si no, se retira.

El `⟨31⟩` debería seguir la tabla por tamaño de mesa (§6.3); la simulación lo decide.

### 6.7 Personalidades por asiento — SELLADO (ya existen; se calibran)

Los cuatro temperamentos actuales (`CONSERVADORA / EQUILIBRADA / AGRESIVA / IMPREDECIBLE`, `aiPlayer.js:13-18`, reparto por partida `:563-574`) se conservan. Cada uno **desplaza unos puntos** los umbrales de §6.3 y el `⟨31⟩` de §6.6 (desplazamientos de TRABAJO, del orden de `⟨±2⟩`). La IMPREDECIBLE conserva su ruido.

### 6.8 Pasar con mano grande — TRABAJO

Con probabilidad `p` por reto (`⟨0 / 0,15 / 0,25⟩` para Básico / Avanzado / Pro), una IA con puntaje sobre el umbral de subida fuerte **pasa o iguala en `BET_2`** y sube fuerte en `BET_3`. Es lo que hace ilegible a la IA sin memoria de rival (Victor descartó el modelado del rival).

### 6.9 Ritmo humano — TRABAJO

El tiempo de decisión deja de ser fijo (`AI_ACTION_MS = 1.125 ms`, `GameTable.jsx:60`) y pasa a un rango con sesgo: más largo cuando la decisión es grande (subida fuerte, all-in), más corto al pasar o igualar barato. Rango de trabajo `⟨700–2.200 ms⟩`. Sigue congelándose con `useCongelado`. El ritmo vive en pantalla como hoy; la IA solo declara «cuán grande» fue su decisión.

### 6.10 IA quebrada — SELLADO

Se va con la ceremonia actual («salida digna», `GameTable.jsx:1310-1332`) y la mesa sigue con menos. Sus fichas restantes (< un ante) no vuelven a nadie: se descartan (no son dinero de nadie; la IA no compra sus fichas).

### 6.11 Reproducibilidad — SELLADO (L-3)

El azar de la IA (seis puntos, `aiPlayer.js:494, 644, 696, 803, 852, 864`) y el del barajado (`deck.js:45`) pasan a un **generador inyectable** con `Math.random` por defecto. Sin esto la simulación afina contra ruido (R-3b). En el servidor (MOT-1) el generador inyectado es CSPRNG (K-5(a)).

---

## 7. Pantalla «Retar a las IAS» — SELLADO (lámina en Fase 1e)

Una sola pantalla con cuatro filas de chips (reto · jugadores con nota de comodín · apuesta según el reto · entrada `5× / 15× / 50× / Otra…`) y un botón que resume la elección. Recuerda reto/jugadores/apuesta, nunca la entrada. **Mismo componente** que «Armar una mesa» de PvP (K-3a: fila `FilaChips` + carcasa compartidas), con la **política de memoria como parámetro** (PvP recuerda su configuración entera; vs IAS olvida la entrada). Las cadenas pasan por `t()` (hoy las tres pantallas de selección no lo usan, E-6). Sustituye a `NivelSelect` + `ModeSelect` y retira el código muerto `TableSelect` / `STAKE_OPTIONS`.

---

## 8. Lo que hereda el macro 2 (Jugar vs jugador)

El motor y `pozos.js` son los mismos. Solo cambia la interfaz y la base de datos:

- **Sin niveles**: solo la apuesta. Lista de **siete**: `50 · 100 · 200 · 500 · 1.000 · 2.000 · 5.000` (se añade el 50 a `APUESTAS_PVP`).
- **Entrada por jugador fija, dos opciones**: **Corta 15×** · **Llena 50×**, mostradas en HC. Flujo: jugadores → apuesta → entrada.
- Identidad de mesa abierta: **jugadores × apuesta × entrada** (índice parcial a tres columnas).
- Para sentarse: **saldo real ≥ entrada** (sustituye a la regla del 5×).
- **Pila en la mesa siempre visible**; el saldo total nunca. **Sin recarga.**
- «Ocultar saldo» del menú de tres puntos: pierde su sentido original; queda por decidir si se retira o se reasigna a la billetera.
- Todo lo del §4 (all-in, capas) aplica idéntico. Nada del §5 ni del §6 aplica (no hay IA en PvP).
- **Mano de la primera mano**: cada jugador elige una carta al azar; gana el valor nominal más alto (el 12 de cualquier palo es el mayor); empate → solo los empatados eligen otra carta de las que quedan; el ganador es la Mano. Después rota un asiento por mano; el Pie es el asiento anterior a la Mano. **Lo ejecuta el servidor.**

---

## 9. Lo que el contrato del árbitro de MOT-1 necesita

### 9.1 Ediciones de MOT-1 que escribe APU-1

De la lista de seis de K-1(a), APU-1 escribe **1, 4, 5 y 6** (por el orden sellado APU-1 → MOT-1):

| # | Edición | Qué cambia con APU-1 |
|---|---|---|
| 1 | exportar `applyBetAction` | además cambia de semántica: sin reescritura a retiro, con rechazo de acción ilegal y all-in |
| 4 | `createInitialState` con lista de jugadores | la lista lleva **fichas por asiento** (entrada del humano, pila de cada IA) |
| 5 | quitar el fin de mesa atado al asiento 0 | necesario para la recarga; el motor ya no devuelve `GAME_OVER` por quiebra del 0 con ≥2 vivos |
| 6 | extensiones `.js` en los cuatro imports | sin cambio; inocua para Vite y Vitest |

Las ediciones 2 (asiento como parámetro) y 3 (descarte por asiento) quedan para MOT-1.

### 9.2 Lo nuevo que el árbitro hereda

- **`pozos.js`** (puro, no protegido, importado por el motor): legalidad de cada acción y su costo, cálculo de capas al cerrar ronda, reparto por capas al cierre de mano. Es la única fuente de verdad; el árbitro la importa dentro del grafo como hoy viaja `aiPlayer.js`.
- **Forma del estado**: `pot` deja de ser escalar (capas con elegibles), `contribMano` por jugador (además del `contrib` por ronda), marca `allIn` por jugador, `entrada` por jugador.
- **Rechazo de acción ilegal**: el árbitro lo devuelve al cliente en vez de aplicarlo.
- **Recarga** es una acción que en PvP **no existe**: el contrato la rechaza siempre.
- **Generador inyectable** en `deck.js` y `aiPlayer.js`: el servidor inyecta CSPRNG.

---

## 10. Tabla de parámetros

| Parámetro | Valor | Clase | Dónde vive (propuesta) |
|---|---|---|---|
| Multiplicadores | `[1, 2, 5, 10]` | SELLADO | `betting.multiplicadores` (hoy literal en `GameTable.jsx:1919`) |
| Piso de entrada | 5× | SELLADO | `betting.entrada.piso` |
| Techo de entrada | 50× | SELLADO | `betting.entrada.techo` |
| Entrada media (botón) | 15× | SELLADO | `betting.entrada.medio` |
| Margen de la IA | 1.000 HC | SELLADO | `ia.margenPila` |
| Bono de bienvenida | 2.500 HC | SELLADO | `salas.js:39` `BONO_BIENVENIDA` (mueve `ALCANCE_NUEVOS` y dos aserciones) |
| Disparador de recarga | pila < 5× unit | SELLADO | `betting.recarga.umbral` |
| Plazo de la pregunta | 10 s, defecto «no» | SELLADO | `betting.recarga.plazoMs` |
| Umbral de subida fuerte por mesa | `⟨41/40/36/33⟩` | TRABAJO | `ia.subidaFuerte.porMesa` |
| Tamaño de bloque de farol | `⟨15/12/8⟩` por reto | TRABAJO | `ia.farol.bloquePorNivel` |
| Fracción del pozo (pago y all-in) | `⟨1/4⟩` | TRABAJO | `ia.fraccionPozo` |
| Puntaje mínimo de all-in | `⟨31⟩` (o tabla por mesa) | TRABAJO | `ia.allIn.puntajeMin` |
| Desplazamiento por temperamento | `⟨±2⟩` | TRABAJO | en cada perfil de `aiPlayer.js:13-18` |
| Pasar con mano grande | `⟨0 / 0,15 / 0,25⟩` | TRABAJO | `ia.pasarConManoGrande` |
| Ritmo de decisión | `⟨700–2.200 ms⟩` | TRABAJO | `GameTable.jsx` (sustituye `AI_ACTION_MS`) |
| `subidaMaximaPorAccion`, `maximoPorRonda`, `subidaMinima`, `allInEnabled` | — | RETIRAR | `ajileiConfig.js:16-18`: sin lectores; los sustituye este documento |
| `saldoInicial: 5000` | — | RETIRAR | `ajileiConfig.js:22` y sus cinco lectores (A-1) |

---

## 11. Predicciones comprobables (para la Fase 1d)

Las cifras de TRABAJO se fijan comparando la simulación con lo que Victor ha vivido en cuatro meses de juego. Predicciones ya aportadas, a completar por Victor antes de la 1d:

- En mesa de dos de 100 HC, hoy gana **6–7 de cada 10** partidas.
- Con 5 IAS jugó **98 manos (~1 h 10)** sin quebrarlas a todas.
- Sacar 40 o más es mucho más frecuente en mesa de dos que en mesa de cinco; en mesa de cinco se gana y se pierde con 21.
- Pendientes de que Victor las enuncie: cuántas manos debería durar una partida de dos al techo; qué porcentaje de los faroles de la IA debería salir mal; con qué frecuencia el humano debería verse forzado al all-in.

Método: cada parámetro se barre en el banco (K-2a) y se mide contra estas predicciones; la conducta se mira en pantalla con el modo del arnés (K-2c).

---

## 12. Economía — parqueado en ECO-1

Ganarle a la IA **acuña** Heptacoins (la IA no compra sus fichas) y eso desincentiva los paquetes de la tienda. Decisión consciente de Victor: se acepta por ahora; la válvula (presupuesto por sesión o rake invisible) pertenece a ECO-1. Se deja escrito aquí para que no se descubra dentro de seis meses.
