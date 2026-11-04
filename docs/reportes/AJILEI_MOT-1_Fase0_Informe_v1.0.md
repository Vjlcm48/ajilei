# AJILEI · MOT-1 · Fase 0 · Informe — Diagnóstico del motor (solo lectura) · v1.0

- **Campaña:** MOT-1 — Motor árbitro en servidor
- **Ficha:** `AJILEI_MOT-1_Fase0_v1.0.md` (2026-09-12)
- **Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
- **Base medida:** `main` en `f9ee503`, árbol limpio salvo los residuos declarados
- **Fecha:** 2026-09-12

## 0. Método y límites

- **Nada de producción se tocó.** Esta es la única escritura del trabajo. `git diff --stat` vacío al cerrar (§STOP).
- Todo lo dicho abajo sale de **leer archivos con número de línea** o de **ejecutar el motor real**. Las ejecuciones se hicieron con `node` leyendo el guion **por stdin** y registrando `scripts/_resolveExt.mjs` (el gancho de resolución que ya usa el arnés), así que **no se creó ningún archivo de sonda**.
- Se ejecutaron, en modo lectura: `npx vitest run scripts/ src/` (lo mismo que `npm test`), `npx eslint .`, y `node scripts/diagSAL.mjs sal` contra un `vite` de desarrollo que levanté y apagué en la misma sesión. Sus capturas caen en `capturas-sal/`, que `.gitignore` ignora.
- **No se consultó Supabase en vivo.** Todo lo de servidor viene de las migraciones, del código del cliente y de informes anteriores (citados). Lo que solo se puede confirmar contra el proyecto vivo va marcado **«no determinable por lectura»**.
- **Nomenclatura de hallazgos:** `R-n` = discrepancia regla↔código (Bloque C4). `H-n` = contradicción con un informe, un comentario o esta misma ficha (Bloque H). `D5-x` = validación ausente, probada ejecutando el motor.

---

## Bloque A — Localización y forma del motor

### A1. Rutas y lista canónica

```
$ git ls-files | grep -iE "gameEngine|aiPlayer|Protegidos|Reglas|Motor"
docs/AJILEI_Protegidos_v1.0.md
docs/AJILEI_Reglas_Mano_Congeladas_v1.0.md
src/engine/aiPlayer.js
src/engine/gameEngine.js
```

Lista canónica **tal como está** en `docs/AJILEI_Protegidos_v1.0.md:47-53` (el documento se titula «Lista canónica v1.3», aunque el archivo lleva v1.0 en el nombre):

| # | Archivo | Autoridad que lo protege |
|---|---|---|
| 1 | `src/engine/gameEngine.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 2 | `src/engine/aiPlayer.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 3 | `src/config/seatLayouts.js` | `AJILEI_Diseno_Landscape_v1.0.md` §1 · `AJILEI_Componente_Fichas_v2.0.md` §12 · instrucción IDN-1 |
| 4 | `src/styles/opponentPanel.css` | Instrucción IDN-1 |
| 5 | `src/styles/gameTable.css` | Instrucción EMB-2 · **reafirmado por fallo de Victor del 2026-08-20** |

**Son cinco.** Pero **hay otra lista de cinco, distinta, viva en `docs/`** → ver **H-4**, que afecta directamente a MOT-1.

### A2. Tamaño

```
$ wc -lc src/engine/*.js src/config/ajileiConfig.js
$ grep -c "^export" …
```

| Archivo | Líneas | Bytes | `export` | Último commit |
|---|---:|---:|---:|---|
| `src/engine/gameEngine.js` | 548 | 22 060 | 11 | `fe8bbd2` (2026-07-21) |
| `src/engine/aiPlayer.js` | 908 | 51 000 | 7 | `92774ee` (2026-08-15) |
| `src/engine/deck.js` | 49 | 1 252 | 7 | `819e276` (2026-06-12) |
| `src/engine/handEvaluator.js` | 67 | 2 497 | 3 | `fe8bbd2` (2026-07-21) |
| `src/config/ajileiConfig.js` | 27 | 472 | 2 | — |
| **Total del cierre transitivo** | **1 599** | **77 281** | **30** | |

### A3. Superficie pública completa

**`gameEngine.js`** (11):

| Export | Parámetros | Devuelve |
|---|---|---|
| `PHASES` (`:6-17`) | — | Objeto de 10 fases: `WAITING, DEAL_2, BET_1, DEAL_3, BET_2, DISCARD, BET_3, SHOWDOWN, PAYOUT, GAME_OVER`. **`SHOWDOWN` nunca se asigna** (ver H-9). |
| `MIN_BET` (`:19`) | — | `10` (`AJILEI_CONFIG.betting.apuestaMinima`). **Sin consumidores** en `src/` ni `scripts/`. |
| `maxDiscard(numPlayers)` (`:23-25`) | `number` | `5` si ≤4, `3` si 5. |
| `makeHandRules(ruleN)` (`:40-46`) | `number` | `{ ruleN, comodinValue (10\|11\|null), maxDiscard }`. |
| `createInitialState(unit = 10, numPlayers = 2)` (`:56-89`) | ante por mano, tamaño de mesa | Estado `WAITING` de 16 claves, sin `deck`. Asiento 0 = humano «Tú», el resto IA; fichas = `saldoInicial` (5000) para todos. |
| `startHand(state)` (`:367-453`) | estado | Elimina a quien no paga el ante, detecta fin de mesa, rota Mano/Pie, cobra antes, **baraja**, reparte 2 por jugador, congela `handRules` → `DEAL_2` (o `GAME_OVER`). |
| `advanceFromDeal(state)` (`:456-471`) | estado | `DEAL_2→BET_1`, `DEAL_3→BET_2`; en otra fase devuelve el mismo objeto. |
| `applyPlayerBetAction(state, action, betAmount)` (`:474-476`) | estado, `'pasar'\|'apostar'\|'igualar'\|'subir'\|'retirarse'`, monto | `applyBetAction` **con asiento 0 fijo**. |
| `applyAIBetAction(state)` (`:479-483`) | estado | Pide `decideBetAction(state, activePlayerIndex)` a la IA y aplica con `state.unit` (ignora cualquier monto). |
| `applyDiscard(state, humanDiscardIndices)` (`:486-535`) | estado, `number[]` | Recorre Mano→Pie; **todo asiento `isHuman` usa el mismo array**; los demás, `decideDiscard` de la IA; repone del mazo → `BET_3`. |
| `toggleDiscard(state, cardIndex)` (`:538-548`) | estado, índice | Alterna en `selectedDiscards` respetando `handRules.maxDiscard`. |

No exportadas (internas): `makePlayer :51`, `activePlayers :92`, `countAlive :98`, `nextAliveIndex :104`, `isRoundOver :113`, `nextActiveIndex :120`, `resolveWinner :130`, `doShowdown :139`, `advanceBettingPhase :205`, **`applyBetAction :249`** (la única que acepta asiento arbitrario).

**Dependencias del motor** (su superficie también viaja si el motor viaja):

| Archivo | Export | Parámetros | Devuelve |
|---|---|---|---|
| `aiPlayer.js` | `_CURVAS_PARA_TEST` `:424` | — | Tablas de curvas (solo pruebas). |
| | `_DIAG_PRO` `:479` | — | **Objeto mutable** de contadores de diagnóstico. |
| | `initPersonalities(numPlayers)` `:501` | `number` | `void`; **escribe estado de módulo**. |
| | `getPersonalityName(aiIndex)` `:512` | `number` | Nombre de perfil o `null`. |
| | `_resetForTesting()` `:517` | — | `void`; borra el estado de módulo. |
| | `decideBetAction(state, aiIndex)` `:650` | estado, asiento | `{ action }`. Lee y escribe estado de módulo. |
| | `decideDiscard(state, aiIndex)` `:875` | estado, asiento | `number[]`; en Pro anota en `_descartes`. |
| `deck.js` | `PALOS` `:1`, `VALORES` `:2`, `VALUE_NAMES` `:4` | — | Constantes. |
| | `getCardPoints(value)` `:9` | `number` | 11 / 7 / 6 / 10. |
| | `createDeck()` `:16` | — | 40 cartas `{id, value, palo, points, name}` en orden fijo. |
| | `drawRank(rank)` `:34` | `number` | Rango para un «robo inicial» con As la más baja. **Sin ningún consumidor** (ver C1). |
| | `shuffleDeck(deck)` `:42` | array | Copia barajada. |
| `handEvaluator.js` | `getComodinValue(n)` `:2` | `number` | `10` (4), `11` (5), `null`. |
| | `getBestSuitScore(cards, numPlayers = 2, comodinEnabled = false)` `:8` | | `{ palo, points, suitScores }`. |
| | `isAjilei(cards, numPlayers)` `:38` | | `boolean` (natural 51; comodín 52 solo con N=5). |
| `ajileiConfig.js` | `STAKE_OPTIONS` `:1`, `AJILEI_CONFIG` `:3` | — | Constantes. |

### A4. Grafo de dependencias

```
src/engine/gameEngine.js
 ├─ './deck'               → src/engine/deck.js            (no importa nada)
 ├─ './handEvaluator'      → src/engine/handEvaluator.js   (no importa nada)
 ├─ './aiPlayer'           → src/engine/aiPlayer.js
 │    ├─ './handEvaluator.js'
 │    └─ './deck.js'
 └─ '../config/ajileiConfig' → src/config/ajileiConfig.js  (no importa nada)
```

**Terceros (`node_modules`): ninguno.** Cinco archivos del repo. Cuatro especificadores **sin extensión**, todos en `gameEngine.js:1-4` (ver F3).

### A5. Contaminación de entorno

```
$ rg '\b(window|document|localStorage|sessionStorage|navigator|Audio|Howl|fetch|process|require|import\.meta|React|useState|useEffect)\b|Math\.random|crypto|Date\.now|new Date|performance\.now' src/engine
src\engine\deck.js:45:    const j = Math.floor(Math.random() * (i + 1))
src\engine\aiPlayer.js:494:    const j = Math.floor(Math.random() * (i + 1))
src\engine\aiPlayer.js:644:  const factor = 1 + (Math.random() * 2 - 1) * noise
src\engine\aiPlayer.js:696:      if (phase !== 'BET_3' && Math.random() < FREC_DISIMULO) {
src\engine\aiPlayer.js:803:  const farolar = farolRespaldado && Math.random() < FREC_FAROL
src\engine\aiPlayer.js:852:    if (scoreEf >= raiseMin) return (canAffordRaise && Math.random() < 0.6) ? …
src\engine\aiPlayer.js:864:    if (scoreEf >= raiseMin) return (canAffordRaise && Math.random() < 0.7) ? …

$ rg (mismo patrón) src/config/ajileiConfig.js
No matches found
```

**Cero apariciones** de `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, `Audio`, `Howl`, `fetch`, `process`, `require`, `import.meta` o React en el motor y sus cuatro dependencias. Las únicas coincidencias son `Math.random` (Bloque B).

### A6. ¿Estado a nivel de módulo? — **El motor no; su dependencia `aiPlayer.js` sí**

**`gameEngine.js`:** solo tres constantes de módulo — `PHASES :6`, `MIN_BET :19`, `DEFAULT_UNIT :20`. Ninguna se reasigna ni se muta. Todas las funciones devuelven objeto nuevo (`return { ...state, … }`).

**`deck.js`, `handEvaluator.js`, `ajileiConfig.js`:** solo constantes.

**`aiPlayer.js` — estado mutable de módulo, enumerado:**

| Variable | Línea | Quién la escribe |
|---|---|---|
| `let _assignments` | `:461` | `initPersonalities :504-508`, `_resetForTesting :518` |
| `let _lastNumPlayers` | `:462` | `initPersonalities :505`, `_resetForTesting :519` |
| `let _lastHandCount` | `:463` | `_ensurePersonalities :572`, `_resetForTesting :520` |
| `let _lastAliveCount` | `:464` | `_ensurePersonalities :573`, `_resetForTesting :521` |
| `let _descartes` | `:471` | `_anotarDescarte :597-608`, `_olvidarDescartes :473` |
| `const _DIAG_PRO` (objeto mutado) | `:479-489` | `decideBetAction :678, :695, :697, :734, :802, :808-810, :833-835` |

Más constantes de tabla que no se mutan: `PROFILE_NAMES :11`, `PROFILES :13`, `RANGO_* :39-41`, `CARTAS_BARAJA :77`, `CURVA_FINAL :154`, `TABLA_BET_1 :182`, `TABLA_BET_2 :191`, `CURVA_DESCARTE :296`, `PISO_Q :326`, `CALLMIN_MEDIO :376`, `FREC_FAROL :417`, `FREC_DISIMULO :418`.

**Consecuencia para la Fase 1.** Hay que separar dos casos:

- **PvP puro (sin asientos de IA):** `applyDiscard` solo llama a `decideDiscard` cuando `player.isHuman` es falso (`gameEngine.js:500-502`), y nadie llamaría a `applyAIBetAction`. En ese caso **no se lee ni se escribe estado de módulo**: una instancia puede servir cinco mesas a la vez.
- **Si la IA sube al servidor:** `_assignments` y `_descartes` son **de proceso, no de mesa**. `_ensurePersonalities` (`:563-574`) detecta «partida nueva» cuando `handCount` baja o `aliveCount` sube; dos mesas intercaladas en el mismo *isolate* dispararían esa señal en cada llamada (re-sorteo de perfiles constante) y la memoria de descartes de Pro se cruzaría entre mesas. **Con IA en servidor, una instancia NO puede servir varias mesas** sin cambiar `aiPlayer.js`.

### A7. ¿Clases o funciones?

**Funciones sueltas y literales de objeto.** `rg "^\s*class |new [A-Z]" src/engine/*.js` → sin coincidencias. No hay instancias que compartir.

---

## Bloque B — Azar y determinismo

### B1. Fuentes de azar y tiempo

| Ruta:línea | Uso |
|---|---|
| `deck.js:45` | Fisher-Yates de `shuffleDeck` — **el único azar del camino PvP** |
| `aiPlayer.js:494` | `_shuffled`: sortea los 4 perfiles de personalidad entre asientos IA |
| `aiPlayer.js:644` | `_jitter`: ruido ±15 % en umbrales del perfil IMPREDECIBLE |
| `aiPlayer.js:696` | Pro: jugar lento con Ajilei (50 %) |
| `aiPlayer.js:803` | Pro: disparar farol respaldado (50 %) |
| `aiPlayer.js:852` | BET_2: subir con mano fuerte (60 %) |
| `aiPlayer.js:864` | BET_3: subir con mano fuerte (70 %) |

`crypto.getRandomValues`, `Date.now`, `new Date`, `performance.now`: **cero** en el motor y sus dependencias (A5). Los dos `Date.now()` del juego viven en la pantalla, para ids de animación: `GameTable.jsx:406` y `:1323`.

### B2. Construcción y barajado del mazo

- **Construcción:** `createDeck()` (`deck.js:16-30`), 4 palos × 10 valores en orden fijo. Se crea un mazo **nuevo cada mano**.
- **Barajado:** `shuffleDeck` (`deck.js:42-49`), **Fisher-Yates (variante de Durstenfeld) bien implementado** (`j ∈ [0, i]`), con `Math.random`.
- **Único punto de llamada:** `startHand`, `gameEngine.js:421` → `shuffleDeck(createDeck())`.
- Se reparte desde el principio del array (`deckPtr`, `:422-429`) y las reposiciones del descarte salen con `deckCopy.shift()` (`:510`).

### B3. ¿Semilla? — **NO**

`shuffleDeck(deck)` recibe un solo parámetro y lleva `Math.random` cableado (`deck.js:45`). `grep -rn "seed\|semilla" src/engine` → nada. No se puede reproducir una partida desde un valor inicial. Las pruebas que necesitan determinismo **mockean** (`vi.mock` de `aiPlayer` en `testEngine :12`, `testEliminations :9`, `testHandRules :32`; `spyOn(Math, 'random')` en `testNivel1/2`).

**Dato que abarata la auditoría:** en PvP puro el único suceso aleatorio de cada mano es el barajado, y **el mazo barajado viaja entero dentro del estado** (`state.deck`, `:437`). Guardar el estado justo después de `startHand` basta para reconstruir el resto de la mano sin semilla.

### B4. Reparto inicial — **lo hace el motor, de golpe; la pantalla solo lo re-anima**

- **2 cartas:** `startHand`, `gameEngine.js:420-432`: dos vueltas Mano→Pie, saltando retirados.
- **3 cartas:** dentro de `advanceBettingPhase` al cerrarse `BET_1` (`:214-231`). **El estado que sale de la última apuesta de BET_1 ya trae las 5 cartas de cada jugador.**
- **Carta a carta es solo visual:** `GameTable.jsx:131-140` («Replays the engine's deal visually») y el efecto `:652-680` (`launchFlyingCard`).

---

## Bloque C — Mano y pie

### C1. ¿Existe el concepto? — **Sí: `manoIndex` y `pieIndex`**

- Nombres exactos: `manoIndex`, `pieIndex` (`gameEngine.js:66-67, 78-80, 409-410, 445-447`). En pantalla: pastillas «Mano»/«Pie» (`GameTable.jsx:1463, 1872`).
- **Vestigio de un sorteo:** `drawRank` (`deck.js:32-40`) — «Maps printed card value to its rank in the initial draw (As is the LOWEST)». `grep -rn drawRank` en todo el repo → **solo su definición**. Nadie la llama: la regla de un robo inicial existió en alguna fuente y nunca se cableó.

### C2. ¿Cómo se decide hoy? — **Fijo, y rota +1 por mano**

```js
// gameEngine.js:64-67
// pieIndex = N-1: on the first startHand call (no rotation for handCount=0),
// manoIndex stays at 0 → human is Mano on the first hand of every session.
const pieIndex  = numPlayers - 1
const manoIndex = 0
```

```js
// gameEngine.js:409-410
const newPieIndex  = state.handCount === 0 ? state.pieIndex : nextAliveIndex(players, state.pieIndex)
const newManoIndex = nextAliveIndex(players, newPieIndex)
```

- **Mano 1:** el asiento 0 (el humano) es Mano; el asiento N−1 es Pie. **No hay sorteo.**
- **Manos siguientes:** el Pie avanza al siguiente asiento vivo (índice +1, circular) y la Mano es el siguiente vivo tras el Pie.
- Lo sellan `testEngine.test.js:125` («2. Rotación Pie / Mano») y `testEliminations.test.js:152` («Rotación Mano/Pie entre vivos»).

### C3. Reglas que dependen de la **posición**

| # | Regla | Código |
|---|---|---|
| 1 | Orden de reparto Mano→Pie (2 y 3 cartas) | `gameEngine.js:424-431`, `:219-226` |
| 2 | Abre cada ronda de apuesta la Mano | `:211` (`advanceBettingPhase`), `:445` (`startHand`), `:532` (`applyDiscard`) |
| 3 | Orden de turno: siguiente no retirado, índice +1 | `:120-127`, `:360` |
| 4 | Orden de descarte y reposición Mano→Pie — **decide qué cartas del mazo recibe cada uno** | `:495-513` |
| 5 | Desempate de showdown: gana la Mano; si no, el más cercano a la Mano | `:157-163` |
| 6 | Mensajes que dicen «Tu turno» según `manoIndex === 0` | `:457-468`, `:519` |
| 7 | IA: umbral −2 si es Pie, +1 si es Mano | `aiPlayer.js:713` |
| 8 | Pantalla: el mazo se pinta en el asiento del Pie | `GameTable.jsx:1277`, `:991`, `:1008` |

**No dependen de la posición** —y la ficha dice que sí (ver **H-3**)—: el **valor del comodín** y el **tope de descarte** dependen del **número de vivos al barajar** (`gameEngine.js:381` → `makeHandRules(alive)` en `:441`; `handEvaluator.js:2-6`; `gameEngine.js:23-25`). El ante lo pagan todos igual (`:412-418`).

### C4. Reglas escritas contra código

**`AJILEI_Reglas_y_Motor_v2.md` NO está en el repositorio.**

```
$ git ls-files | grep -iE "reglas|motor"
docs/AJILEI_Reglas_Mano_Congeladas_v1.0.md
$ find .. -maxdepth 3 -iname "*Reglas*"     (carpeta padre, fuera del repo)
../ajilei/docs/AJILEI_Reglas_Mano_Congeladas_v1.0.md
../SumaMente/…   (otro proyecto)
```

Documentos de reglas que **sí** están y se contrastaron: `AJILEI_Reglas_Mano_Congeladas_v1.0.md` (HR-1), `AJILEI_Mensajes_Resultado_v1.0.md`, `AJILEI_Modos_y_Asistencia_v1.0.md`/`v1.1.md` y `docs/reportes/AJILEI_PUE_Extraccion_v1.0.md` §2.

**Lo que coincide, y conviene decirlo:** la tabla de verdad por mesa de HR-1 §2 (2/3 sin comodín y tope 5; 4 con comodín 10 y tope 5; 5 con comodín 11, tope 3 y Ajilei de 52) **coincide exactamente** con `handEvaluator.js:2-6, :38-58` y `gameEngine.js:23-25`. También coincide la congelación: `makeHandRules` solo se escribe en `startHand` (`:390, :402, :441`) y en la semilla de `createInitialState` (`:74`).

**Discrepancias:**

- **R-1 · No hay documento que diga cómo se decide la primera Mano.** La ficha (§1) da por hecho que es aleatoria; el código la fija en el asiento 0 (C2); `drawRank` insinúa un robo con «As la más baja» que ningún documento del repo describe. La regla fuente (¿`Reglas_y_Motor_v2`?) no está versionada. **Sin ella la Fase 1 no puede implementar la primera decisión de la partida.**
- **R-2 · El «barajado del Pie» puede hacerlo un asiento que no está en la mesa.** HR-1 §1 fija las reglas «en el barajado del Pie». En la mano 1 no hay rotación (`:409`), así que si el asiento N−1 está eliminado **el Pie queda en un asiento eliminado**. Medido:

  ```
  C5 mesa4, asiento3 sin fichas en mano 1: phase DEAL_2 alive 3
     handRules {"ruleN":3,"comodinValue":null,"maxDiscard":5} pieIndex 3 pie eliminado? true manoIndex 0
  ```

  En vs-IA no ocurre (todos nacen con 5000). En PvP ocurre en cuanto una silla quede vacía o un jugador no cubra el ante.
- **R-3 · El mensaje de desempate del motor en mesas de 3+ contradice la regla de mensajes.** `AJILEI_Mensajes_Resultado_v1.0.md:88`: `winner === manoIndex` → «por ser la Mano». El motor escribe siempre «por ser el más cercano a la Mano», **también cuando gana la Mano** (`gameEngine.js:195`). La pantalla ya no pinta `game.message` (`GameTable.jsx:297-300`); lo hace bien `resultadoCore.js:124`. **Si el servidor reenvía `message`, vuelve el texto erróneo.**
- **R-4 · HR-1 §5 dice «7 tests»; hay 9.** `grep -cE "^\s*it\(" scripts/testHandRules.test.js` → 9. El `describe` añadido es `DSK-U0` (`:256`). El documento no se actualizó.
- **R-5 · Hueco, no contradicción: una mano de comodín vale 51 en mesa de 4 sin ser AJILEI.** `getBestSuitScore` suma los 10 del comodín (`handEvaluator.js:28`), pero `isAjilei` solo reconoce el comodín con N=5 (`:47`). HR-1 §2 no dice qué pasa cuando un 41+10 empata a puntos con un Ajilei natural de 51: lo resuelve el desempate por posición (`gameEngine.js:157-163`) y el mensaje dice «¡AJILEI!» solo si el ganador es el natural. Lo documentó `PUE_Extraccion` §2.2; no está en las reglas.
- **R-6 · Los puntos PvP (`ruleN + 3`) están sellados y no implementados.** `Modos_y_Asistencia_v1.0.md` §6.2-6.3. `src/config/niveles.js:68` dice expresamente que no viven allí; `grep "ruleN + 3"` en `src/` → solo ese comentario. Es deuda declarada («durmientes», v1.1 §6), no divergencia.
- **R-7 · Dos listas de protegidos distintas, y la diferencia es justo el archivo del azar.** Ver **H-4**.

### C5. ¿Se adapta el motor a un tamaño de mesa distinto?

- **Las reglas, sí, solas:** se recalculan en cada `startHand` con los vivos (`:381, :441`), y los eliminados se saltan en rotación (`:104-111`), reparto (`:427`), turno (`:120-127`) y descarte (`:498`).
- **Las posiciones, no:** `numPlayers` se fija al crear (`:56`) y es la longitud del array y el módulo de todos los recorridos (`:369`, `:146`, `:488`). No hay forma de declarar un asiento **ausente**: solo «sin fichas» (`chips < unit`, `:376`). Y hacerlo así tiene tres efectos laterales medidos o leídos:
  1. Pie en asiento ausente en la mano 1 (R-2).
  2. El ausente se anuncia como bancarrota: entra en `eliminatedNames` (`:382`).
  3. **Si el ausente es el asiento 0, la mesa termina para todos:**

     ```
     E5 asiento0 sin fichas con 3 vivos: phase GAME_OVER alive 3 msg Te quedaste sin fichas.
     ```

     (`gameEngine.js:399-406`).
- **`player.id` tiene que ser igual al índice del asiento.** `doShowdown` busca `tied.find(p => p.id === seat)` (`:161`), toma `winner = winnerData.id` (`:164`) y `resolveWinner` paga a `i === winner` (`:133`); el retiro total también usa `survivor.id` (`:352`). Un uuid en `id` rompe el pago. Y `sala_jugadores.asiento` admite huecos (0..4 con `unique (sala_id, asiento)`, `sal_a_salas.sql:147-154`): una mesa de 4 puede arrancar con asientos 0, 2 y 3.

**Respuesta:** hay que decírselo — crear el estado con el número real de presentes y asientos contiguos — o cambiar el motor.

---

## Bloque D — Estado de la partida

### D1. Forma y ejemplo real

| Campo | Tipo | Nota |
|---|---|---|
| `phase` | `string` | una de `PHASES` |
| `numPlayers` | `int` | tamaño físico, fijo |
| `aliveCount` | `int` | no eliminados |
| `handRules` | `{ ruleN:int, comodinValue:int\|null, maxDiscard:int }` | congelado al barajar |
| `eliminatedNames` | `string[]` | los de esta mano |
| `unit` | `number` | ante y monto por defecto |
| `players` | `Player[]` | ver abajo |
| `pieIndex`, `manoIndex`, `activePlayerIndex` | `int` | índices de asiento |
| `pot`, `currentBet` | `number` | |
| `selectedDiscards` | `int[]` | **selección de UI del humano, dentro del estado del motor** |
| `winner` | `int\|null` | |
| `message` | `string` | redactado **desde el punto de vista del asiento 0** (`'Tú'`, `'IA'`, `'Tu turno.'`) |
| `handCount` | `int` | |
| `deck` | `Card[]` | **ausente en `WAITING`**; aparece en `startHand` |
| `nivelIA` | `string` | **pasajero** que añade la pantalla (`conNivel`, `GameTable.jsx:306`), no el motor |

`Player = { id:int (=índice), name, isHuman:bool, chips, cards:Card[], contrib, acted:bool, folded:bool, score:null|{palo, points, suitScores}, eliminated:bool }` (`gameEngine.js:52`).
`Card = { id:"valor-Palo", value:int, palo:string, points:int, name:string }` (`deck.js:20-26`).

**Ejemplo real, mesa de 2, primer turno** (`advanceFromDeal(startHand(createInitialState(10, 2)))`, ejecutado; **recortado solo en `deck`**, que traía 36 cartas y aquí se resume a mano):

```json
{
 "phase": "BET_1",
 "numPlayers": 2,
 "aliveCount": 2,
 "handRules": { "ruleN": 2, "comodinValue": null, "maxDiscard": 5 },
 "eliminatedNames": [],
 "unit": 10,
 "players": [
  { "id": 0, "name": "Tú", "isHuman": true, "chips": 4990,
    "cards": [ { "id": "11-Oros", "value": 11, "palo": "Oros", "points": 10, "name": "Caballo" },
               { "id": "12-Oros", "value": 12, "palo": "Oros", "points": 10, "name": "Rey" } ],
    "contrib": 0, "acted": false, "folded": false, "score": null, "eliminated": false },
  { "id": 1, "name": "IA", "isHuman": false, "chips": 4990,
    "cards": [ { "id": "5-Oros", "value": 5, "palo": "Oros", "points": 10, "name": "5" },
               { "id": "12-Bastos", "value": 12, "palo": "Bastos", "points": 10, "name": "Rey" } ],
    "contrib": 0, "acted": false, "folded": false, "score": null, "eliminated": false }
 ],
 "pieIndex": 1,
 "manoIndex": 0,
 "activePlayerIndex": 0,
 "pot": 20,
 "currentBet": 0,
 "selectedDiscards": [],
 "winner": null,
 "message": "A las 2 — Tu turno.",
 "handCount": 1,
 "deck": "‹RECORTE: 36 cartas; primera {\"id\":\"2-Oros\",\"value\":2,\"palo\":\"Oros\",\"points\":10,\"name\":\"2\"}›"
}
```

Tamaño real sin recortar: **3 282 bytes**.

### D2. ¿JSON sin pérdida? — **Sí**

Sonda que recorre el estado buscando `undefined`, funciones, `Map`, `Set`, `Date` y prototipos que no sean `Object`:

```
D2 tipos raros [] roundtrip true
```

Sin referencias circulares (el recorrido habría desbordado la pila). Los «ausentes» son `null` (`score`, `winner`, `comodinValue`), nunca `undefined`. Dos matices semánticos, que no son de serialización: `id` **debe** ser el índice (C5), y `deck` falta en `WAITING`.

### D3. Tamaño de una mesa de 5

200 manos completas con IA real, midiendo `JSON.stringify(estado).length` tras cada transición:

```
D3 mesa5 max bytes por fase (200 manos): { BET_1: 3686, DEAL_3: 3683, BET_2: 3688, DISCARD: 3709, BET_3: 3503, PAYOUT: 3637 }
D3 estimacion con uuid+nombre 20c (mismo estado): 3675 -> 3942
```

**Máximo medido: 3 709 bytes.** Con identidades PvP (uuid y nombre de 20 caracteres) sube unos 270 bytes: **< 4 KB**.

### D4. Público y privado — **hoy es un único objeto omnisciente**

| Público (todos) | Secreto |
|---|---|
| `phase`, `numPlayers`, `aliveCount`, `handRules`, `eliminatedNames`, `unit` | `players[i].cards` para todos menos `i` (hasta el showdown, y **siempre** si `i` se retiró) |
| `players[i]`: `id`, `name`, `chips`, `contrib`, `acted`, `folded`, `eliminated`, **número** de cartas | `deck` (contenido completo) |
| `pieIndex`, `manoIndex`, `activePlayerIndex`, `pot`, `currentBet`, `handCount`, `winner` | |
| `deck.length` (lo lee Pro, `aiPlayer.js:617-618`, y lo justifica como información a la vista, `:265-268`) | |
| `players[i].score` y cartas de los **activos** en `PAYOUT` tras showdown | |
| **Privado de uno pero no secreto:** `selectedDiscards` (hoy global) · `message` (en perspectiva del asiento 0) | |

```
$ rg "vistaParcial|redact|sanitiz|maskState|forPlayer|publicState|hideCards|vistaDe" src
(sin coincidencias)
```

**El motor no distingue nada.** Y hay un agravante en el esquema ya desplegado, que es lo más serio de este informe:

- `salas.estado_partida jsonb` existe con el comentario «**MES-PvP guardará aquí el estado del motor**» (`supabase/migrations/20260905203158_sal_a_salas.sql:101-104, 119-120`).
- `salas` tiene `replica identity full` (`:205`) y está en la publicación `supabase_realtime` (`:852-858`).
- `SalaEspera` escucha `postgres_changes` sobre `salas` (`salasApi.js:310-312`) y, en cada evento, relee **`select('*')`** de la fila (`salasApi.js:284-292`, llamado desde `SalaEspera.jsx:206`).
- La RLS deja a todo miembro leer su sala «en el estado que sea» (`sal_a_salas.sql:257-263`).

**Si el estado de hoy se guardara en esa columna, cada jugador recibiría por Realtime, y por lectura directa, las manos de todos y el mazo entero**, en cada jugada. Ver **H-13** e **I-1**.

### D5. Validación de jugadas

**Lo que el motor sí valida hoy:**

| Validación | Código |
|---|---|
| Saldo: si no cubre la acción → retiro forzado | `gameEngine.js:258-262` |
| Saldo nunca negativo (clamp) | `:301` |
| Tope de descarte (recorta el array) | `:504`; selección `:544` |
| Retirados fuera de reparto, turno y descarte | `:222, :427, :124, :498` |
| Cierre de ronda: todos actuaron y contrib == apuesta | `:113-117` |
| `advanceFromDeal` solo avanza desde `DEAL_2`/`DEAL_3` | `:458-470` |

**Lo que NO valida**, probado ejecutando el motor (`base` = mesa 2 en BET_1, turno del asiento 0):

```
D5a apostar -500: chips 4990 -> 5490 pot 20 -> -480 currentBet -500
D5b apostar 4000 (maximoPorRonda=100): pot 4020 currentBet 4000
D5c apostar 12.5: pot 32.5 chips 4977.5
D5d accion desconocida: phase BET_1 active 1 acted true pot 20
D5e asiento0 apuesta con activePlayerIndex=1: pot 30 active-> 1
D5f apostar en fase DISCARD: phase DISCARD pot 30
D5g pasar con currentBet=20: contrib 0 active-> 1 phase BET_1
D5h descarte [0,0,0,0,0]: deck 26 -> 22 cartas cambiadas 1
D5i descarte [7,99,-1]: deck 26 -> 23 phase BET_3
D5j applyDiscard en fase BET_1: phase-> BET_3
D5k startHand a mitad de mano: handCount 1 -> 2 chips0 4990 -> 4980 pot 20
```

(En D5h/D5i la IA real también descarta; «cartas cambiadas» cuenta solo las del humano.)

| Id | Jugada que un cliente modificado podría colar | Evidencia |
|---|---|---|
| **D5-a** | **Monto negativo: fabrica fichas** y deja el pozo negativo | sonda D5a; `amount = betAmount \|\| state.unit` (`:251`) no comprueba signo |
| D5-b | Monto sin tope: `subidaMaximaPorAccion` (50) y `maximoPorRonda` (100) **no los lee nadie** | sonda D5b; `grep` de ambas claves fuera de `ajileiConfig.js` → 0 |
| D5-c | Monto no entero | sonda D5c |
| D5-d | Acción desconocida = actuar sin pagar; el turno avanza | sonda D5d; `switch` sin `default` (`:269-297`) |
| **D5-e** | **Jugar fuera de turno** | sonda D5e; nada compara con `activePlayerIndex` |
| D5-f | Jugar fuera de fase (apostar en DISCARD, descartar en BET_1, repartir a mitad de mano con doble ante) | sondas D5f, D5j, D5k |
| D5-g | «Pasar» con apuesta viva | sonda D5g |
| D5-h | Índices de descarte duplicados, fuera de rango o negativos, aceptados en silencio | sondas D5h, D5i |
| D5-i | Un **retirado** o **eliminado** que apuesta | por lectura: `applyBetAction` no mira `player.folded` ni `eliminated` (`:249-297`) |
| D5-j | `apostar` con apuesta viva **baja** la apuesta | por lectura: `newCurrentBet = amount` sin comparar (`:276`) |
| D5-k | Subidas sin límite de número por ronda | por lectura: solo lo frena el saldo |

**Las comprobaciones que el juego hace hoy viven en la pantalla**, no en el motor: `canPass/canBet/canCall/canRaise` (`GameTable.jsx:972-976`) y el menú ×1/×2/×5/×10 (`:1918-1929`). En PvP no valen nada.

---

## Bloque E — Consumidores actuales

### E1. Quién importa el motor

| Consumidor | Importa | Líneas |
|---|---|---|
| `src/components/GameTable.jsx` | `PHASES, createInitialState, startHand, advanceFromDeal, applyPlayerBetAction, applyAIBetAction, applyDiscard, toggleDiscard`; `getBestSuitScore`; `AJILEI_CONFIG` | `:32, :38, :39-51` |
| `src/hooks/resultadoCore.js` | `PHASES`, `isAjilei` | `:1-2` |
| `src/hooks/celebracionCore.js` | `PHASES`, `isAjilei` | `:1-2` |
| `src/hooks/consultasCore.js` | `PHASES` | `:1` |
| `src/hooks/cronicaCore.js` | `PHASES` | `:24` |
| Solo `ajileiConfig` | `Lobby.jsx:30`, `lib/saldo.js:26`, `hooks/sesionCore.js:1`, `config/salas.js:30`, `ModeSelect.jsx:5`, `TableSelect.jsx:3` | |
| Pruebas | `testEngine :12, :27-29` · `testEliminations :9, :23-24` · `testHandRules :32, :48-49` · `testAI :14, :25` · `testNivel1 :17-23` · `testNivel2 :18-24` · `testNiveles :15` · `testCronica :29` · `testConsultas :9-10` · `testResultado :3` · `testCelebracion :11-12` | |
| Arnés y banco | `diagDSK.mjs :226-227, :7049, :8086` · `bancoNiveles.mjs :74-76, :854, :973` | |

### E2 y E3. Recorrido de una partida contra la IA

Marcas: **`[P]`** lógica pura del motor · **`[R]`** React (estado, efecto, temporizador) · **`[R·regla]`** React que **decide algo del juego**.

```
App.jsx:450  screen 'table' → <GameTable stake numPlayers nivel>
│
├─[R]  useState inicial ................................ GameTable.jsx:301-308
│        └─[P] createInitialState(stake, numPlayers)     gameEngine.js:56
│            (+ conNivel → nivelIA · + siembraCEL)
│
├─[R·regla] botón «Iniciar mano» / «Siguiente mano» .... GameTable.jsx:1890 · 2009-2021 (300 ms)
│        └─ beginHand() ................................. :1295
│             ├─[P] startHand(prev) ...................... gameEngine.js:367  ← baraja y reparte 2
│             ├─[R·regla] GAME_OVER con asiento 0 quebrado y ≥2 vivos → modal ... :1300
│             ├─[R] eliminados → ceremonia (timers) ...... :1319-1333
│             └─[R] commitNewHand: setGame + barajado 1950 ms ... :1349-1358
│
├─[R·regla] efecto de reparto: carta a carta, 400 ms ... :652-680
│        └─[P] advanceFromDeal → BET_1 .................. gameEngine.js:456
│
├── BET_1 (bucle) ─────────────────────────────────────
│    ├─ turno humano:
│    │    ├─[R·regla] canPass/canBet/canCall/canRaise .. :972-976
│    │    ├─[R] act(action) ............................ :978-982
│    │    │    └─[P] applyPlayerBetAction(prev, action, betAmount)
│    │    └─[R·regla] reloj 20 s → pasar/retirarse ..... :715-733
│    ├─ turno IA:
│    │    └─[R·regla] efecto 1125 ms ................... :906-923
│    │         └─[P] applyAIBetAction → aiPlayer.decideBetAction
│    ├─ activo retirado:
│    │    └─[R·regla] salto inmediato .................. :937-951
│    │         └─[P] applyPlayerBetAction('pasar') | applyAIBetAction
│    └─[P] cierre de ronda → advanceBettingPhase → reparte 3 → DEAL_3   gameEngine.js:214-231
│
├─[R·regla] reparto DEAL_3 + volteos 300/600/900 ms, 2000 ms ... :656-670
│        └─[P] advanceFromDeal → BET_2
│
├── BET_2 (bucle, igual que BET_1) → [P] cierre → DISCARD  gameEngine.js:233-239
│
├── DISCARD
│    ├─[R] toque de carta → [P] toggleDiscard ........... :1428
│    ├─[R] «Descartar» → handleDiscard → startDiscardAnim  :1077, :1039
│    │    └─[P] applyDiscard(g, indices)  ← se calcula YA; la animación va después
│    │         └─[P] aiPlayer.decideDiscard por cada asiento IA
│    ├─[R·regla] reloj 20 s → descarte vacío ............ :728
│    ├─[R·regla] humano retirado → la mesa descarta sola  :958-965
│    └─[R] timers de animación → setGame(nextGame) → BET_3  :1069-1073
│
├── BET_3 (bucle) → [P] cierre → doShowdown → resolveWinner → PAYOUT
│        (o todos se retiran → resolveWinner → PAYOUT)   gameEngine.js:241-243 · 335-354
│        └─[P] isAjilei dentro de doShowdown ............ gameEngine.js:151  ← «AJILEI»
│
├── PAYOUT
│    ├─[R] resultadoCore / celebracionCore / useCoreografia (presentación)
│    └─[R·regla] «Siguiente mano» → beginHand … (vuelve arriba)
│
└── GAME_OVER  ← lo decide startHand (≤1 vivo, o asiento 0 sin fichas)  gameEngine.js:385-406
```

**Lectura de E3:** las **11 transiciones del motor son puras y trasladables**. Pero **todo el ritmo** —cuándo se reparte, cuándo pasa el turno a la IA, cuándo vence el reloj, quién salta al retirado, cuándo empieza la mano siguiente— **vive en efectos y temporizadores de `GameTable.jsx`**. En vs-IA eso es correcto: es una sola pantalla y un solo reloj. En PvP cada `[R·regla]` es una decisión que alguien con autoridad tiene que tomar.

### E4. `aiPlayer.js` ↔ motor — **el motor depende de la IA; no al revés**

- `gameEngine.js:3` → `import { decideBetAction, decideDiscard } from './aiPlayer'`, usado en `:481` y `:502`.
- `aiPlayer.js:1-2` solo importa `handEvaluator.js` y `deck.js`. No importa `gameEngine`.
- **Cargar el motor carga la IA, siempre**, con su estado de módulo (A6). Y `applyDiscard`, que PvP necesita, la referencia (ver **H-5**).

### E5. Reglas que viven fuera del motor y en PvP tendrían que estar en el servidor

| # | Regla | Dónde vive hoy | Por qué pesa en PvP |
|---|---|---|---|
| 1 | **Reloj de turno de 20 s** y su castigo (pasar si no hay apuesta, retirarse si la hay; descarte vacío) | `GameTable.jsx:53` (`TURN_TIME`), `:715-733`, `:728` | El que no juega congela a cuatro. Hoy lo decide el reloj del propio jugador. |
| 2 | **Salto del activo retirado**: el motor da el turno a la Mano aunque se haya retirado | motor `:211, :532`; compensación en `GameTable.jsx:937-951` | Sin la compensación la mesa se queda esperando a alguien que ya no juega. |
| 3 | **Avance de fase tras el reparto** (`advanceFromDeal`) | `GameTable.jsx:652-680` | Cinco pantallas con animaciones de distinta duración no pueden decidir cuándo empieza BET_1. |
| 4 | **Arranque de la mano siguiente** (quién llama a `startHand` y cuándo) | `:1295`, `:2009-2021` | Hoy es un botón del único humano. |
| 5 | **Legalidad de la apuesta** (`canBet`…) y **menú de montos** ×1/×2/×5/×10 | `:972-976`, `:1918-1929` | El motor acepta cualquier cosa (D5). |
| 6 | **Bancarrota de un jugador con la mesa viva** | motor `:399-406` (fin de mesa si cae el asiento 0); modal `GameTable.jsx:1300` | En PvP, que quiebre uno no puede terminar la mesa de los otros. |
| 7 | **Economía de la mano**: `unit = stake` y fichas iniciales = 5000 fijo | `GameTable.jsx:306`; `gameEngine.js:57` | La verdad del dinero ya vive en SQL (`saldo_de`, `sal_a_salas.sql:315`, y la regla 5× en `regla_asiento :285`). Motor y base no se conocen. |
| 8 | **Selección de descarte** como estado global | `gameEngine.js:83, :538-548` | Es de un jugador y en el motor es de la mesa. |
| 9 | **Puntos de ranking** | `sesionCore.js`, `niveles.js:75` (`puntosDe`); PvP `ruleN + 3` sin implementar | Si puntúan en PvP, los tiene que otorgar quien arbitra. |
| 10 | **Mensajes** en perspectiva del asiento 0, con desempate erróneo | `gameEngine.js:173-199, :314-333, :515-523`; la voz real: `cronicaCore.js`, `resultadoCore.js` | Presentación, pero si viajan desde el servidor mienten (R-3). |

---

## Bloque F — Terreno del servidor

### F1. Edge Functions

```
$ ls supabase/functions
ls: cannot access 'supabase/functions': No such file or directory
```

**No hay ninguna en el repo.** ¿Desplegada? **No determinable por lectura**; haría falta `npx supabase functions list` o el panel, que no ejecuté porque no está entre los comandos permitidos. El antecedente es SAL Fase 0 §1.4: cuatro nombres tanteados dieron 404, con la reserva de que tantear no es enumerar.

### F2. CLI y estructura

```
$ npx supabase --version
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.116.0)
```

```
supabase/
├── config.toml            30 líneas; única línea activa: project_id = "ajilei" (:30)
└── migrations/            5 migraciones
    ├── 0001_sup2a_identidad.sql                 355 líneas
    ├── 20260905203158_sal_a_salas.sql         1 115 líneas
    ├── 20260911043500_sal_b1_ajuste.sql         495 líneas
    ├── 20260911103000_sal_b1_ajuste_a3.sql      238 líneas
    └── 20260911230935_sal_b2.sql                373 líneas
(supabase/.temp/ y .branches/ ignorados, .gitignore)
```

`config.toml` no tiene sección `[functions]` ni `[realtime]`: rigen los valores por defecto.

### F3. Compatibilidad con Deno

| # | Obstáculo | Evidencia | Gravedad |
|---|---|---|---|
| 1 | **Especificadores sin extensión**: Deno exige el especificador completo | `gameEngine.js:1-4` (las 4 únicas; `aiPlayer.js:1-2` ya lleva `.js`) | **Bloqueante** sin *bundler* o sin abrir el protegido. Node falla igual: por eso existe `scripts/_resolveExt.mjs`. |
| 2 | Importar desde fuera de `supabase/functions/` (`../../../src/engine/…`) | — | **No determinable por lectura.** Si el empaquetado del despliegue sigue importaciones relativas fuera del directorio de funciones solo lo dice un `functions serve`/`deploy` de prueba. |
| 3 | Estado de módulo de `aiPlayer` compartido entre peticiones de un mismo *isolate* | A6 | Solo si la IA juega en el servidor. |
| 4 | Imports de paquetes npm | ninguno (A4) | — |
| 5 | APIs de Node (`process`, `require`, `Buffer`) | ninguna (A5) | — |
| 6 | Sintaxis que requiera transpilar | ESM puro, sin JSX ni TS; `?.` y `??` (`gameEngine.js:180, :517`) los soporta Deno | — |

### F4. Autenticación cliente → servidor

**Hoy:**
- Un único cliente con la llave publicable: `createClient(url, publishableKey)` (`src/lib/supabase.js:35`).
- La sesión de Supabase Auth la adjunta el SDK solo a cada `rpc`. No hay cabeceras escritas a mano en el repo.
- En SQL, la identidad es `auth.uid()` dentro de funciones `security definer` (p. ej. `sal_a_salas.sql:426, :517, :639, :670`), con `grant execute … to authenticated` (`:818-827`). Invitados desactivados (`anonymous_users: false`, SAL Fase 0 §1.6).

**Qué haría falta para una Edge Function** (hechos de plataforma según la documentación de Supabase, **no verificables leyendo el repo**):
1. Invocar con `supabase.functions.invoke`: `@supabase/functions-js` 2.112.4 está instalado y no se usa. Manda `Authorization: Bearer <access_token>` de la sesión.
2. Mantener la verificación de JWT de la función (por defecto activa; `config.toml` no la toca) y obtener el `uid` del token **dentro** de la función (`auth.getUser(token)` o las *claims*), nunca de un campo del cuerpo.
3. Traducir `uid → asiento` leyendo `sala_jugadores` (PK `(sala_id, jugador_id)`, `asiento` 0..4, `sal_a_salas.sql:147-154`) y comprobar `salas.estado = 'activa'`.

### F5. Inventario del Realtime que ya funciona

| Pieza | Dónde | Qué |
|---|---|---|
| Suscripción de la sala de espera | `SalaEspera.jsx:202-215` → `api.suscribirSala(salaId, releer)` | |
| Canal | `salasApi.js:307-318` | `channel('sala:<salaId>')` |
| Tipo | `:310-315` | **Postgres Changes** ×2: `salas` con `filter: id=eq.<id>` y `sala_jugadores` con `filter: sala_id=eq.<id>`, `event: '*'` |
| Contrato | `SalaEspera.jsx:204-212` | «algo cambió → vuelve a leer»: `leerSala` (`select('*')`, `salasApi.js:284-292`) + `asientosDe` |
| Listado | `salasApi.js:333-340` | `channel('salas:abiertas')`, Postgres Changes sin filtro. **Sin consumidor**: `grep suscribirAbiertas` en `src/` → solo un comentario (`SalaEspera.jsx:38`). |
| **Broadcast** | — | **Ninguno** |
| **Presence** | — | **Ninguno** |
| `replica identity` | `sal_a_salas.sql:205-206` | `full` en `salas` y `sala_jugadores` |
| Publicación `supabase_realtime` | `sal_a_salas.sql:852-864` | `public.salas`, `public.sala_jugadores` (con guarda de existencia) |

**Confirmación viva:** no se consultó `pg_publication_tables` en esta fase (no está entre los comandos permitidos). La última confirmación registrada es la de SAL-A tras el `push`, citada en `AJILEI_SAL-B2_Fase0_Informe_v1.0.md:154`.

### F6. ¿Algo impide Broadcast? — **No hay impedimento.**

`@supabase/supabase-js` y `@supabase/realtime-js` 2.112.4 instalados. Nada en el repo lo bloquea. **Una condición, no un impedimento:** `grep "realtime.messages\|private: true"` en `supabase/` y `src/` → nada. Hoy no existe ninguna política de autorización de Realtime, así que un canal Broadcast público lo podría **escuchar y emitir** cualquier sesión que conozca el nombre del tema (comportamiento de la plataforma según su documentación, no verificable leyendo el repo). Los eventos de partida necesitan **canales privados con políticas sobre `realtime.messages`**, o que solo el servidor emita y que lo emitido no contenga secretos.

---

## Bloque G — Pruebas y arnés

### G1. Pruebas del motor

`grep -cE "^\s*(it|test)\("` por archivo (casos escritos; `.each` cuenta como uno):

| Archivo | Casos | IA | Qué cubre realmente |
|---|---:|---|---|
| `testEngine.test.js` | 44 | **mock** (`pasar`, `[]`) | Conteo de cartas, rotación Pie/Mano, orden de reparto y turno, tope de descarte, comodín y `handEvaluator`, retiro forzoso por saldo, regresión de mensajes N=2, desempate. El `describe` «Tanda C2: DECK_ANCHORS» (`:534`) prueba **`seatLayouts.js`**, no el motor. |
| `testEliminations.test.js` | 15 | mock | Eliminación permanente, reglas por vivos, rotación entre vivos, condiciones terminales, layout efectivo. |
| `testHandRules.test.js` | 9 | mock | HR-1: retiro ≠ eliminación, congelación por fase, tope congelado, abandono, bancarrota diferida, DSK-U0. |
| `testAI.test.js` | 23 | real | Perfiles, aislamiento de información, cordura del retiro, comodín, simulación completa sin saldos negativos, regresión N=2. |
| `testNivel1.test.js` | 25 | real + `spyOn(Math.random)` | Avanzado: prueba de oro contra Básico, curvas re-derivadas. |
| `testNivel2.test.js` | 41 | real + spy | Pro: lectura de descartes, trampa `Proxy` sobre `deck`, faroles. |
| `testNiveles.test.js` | 30 | — | Tablas de niveles y el pasajero `nivelIA` sobre `createInitialState`. |
| `testCronica/Consultas/Resultado/Celebracion` | 7/16/31/37 | — | Presentación; del motor solo usan `PHASES`, `isAjilei`, `getBestSuitScore` y estados construidos a mano. |

**Lo que ninguna prueba cubre** (medido por `grep` y por lectura de los `describe`): entradas ilegales (D5: montos negativos, fuera de turno, fuera de fase, acciones desconocidas); **más de un asiento `isHuman`** (`grep "isHuman: true"` solo aparece en fixtures de un humano en `testAI`); ida y vuelta por JSON; Pie en asiento eliminado en la mano 1; quiebra del asiento 0 con la mesa viva.

### G2. Qué se rompe si el motor se mueve o se duplica

**Si se MUEVE** (cambia la ruta):
- Las 11 pruebas de E1 que importan `../src/engine/…`.
- **Los tres `vi.mock` con ruta literal**, que tienen que coincidir exactamente o el mock deja de aplicarse **sin error**: `testEngine.test.js:12`, `testEliminations.test.js:9`, `testHandRules.test.js:32`. La prueba seguiría pasando o fallando por la razón equivocada.
- Por arrastre, las pruebas de `resultadoCore`, `celebracionCore`, `consultasCore` y `cronicaCore`, cuyos módulos importan `../engine/gameEngine` (E1).
- `scripts/diagDSK.mjs` y `scripts/bancoNiveles.mjs`.
- Envejecen en `docs/` decenas de citas `gameEngine.js:NNN`: no rompen pruebas, pero engañan.

**Si se DUPLICA:** no se rompe nada, y ese es el problema — **las 685 pruebas seguirían vigilando solo la copia del cliente**.

### G3. `diagARN.mjs` y modos que tocan la mesa

**`diagARN.mjs` no existe** (`git ls-files | grep -i arn` y `find . -iname "*diagARN*"` → nada; ver **H-1**). «ARN-1/2/3» son campañas que recablearon **`scripts/diagDSK.mjs`** (`:275-298`, `:7546`, `:4134`).

Modos de `diagDSK.mjs` (`:9358-9393`): `d1d2, d3, bug, shots, gate, lob, b1, tactil, p1, p2, r1, r2, o1, h1, m1, a1, f1, z1, o2, a2, u1, menu-movil, u2, u3, vc, msg, tapetes, vuelo` (+ `all`). Todos son contra vs-IA y, salvo `lob` (el lobby), montan la mesa. **No verifiqué uno a uno** qué recorrido hace cada modo. Otros arneses: `diagSAL.mjs` (`sal`, `shots`: salas, no mesa), `diagPUE.mjs` (Portada, moneda), `diagCEL0.mjs` (celebración). **Ningún modo ejercita PvP ni un motor en servidor.**

### G4. Línea base de la campaña (medida hoy)

| Instrumento | Resultado | Referencia anterior |
|---|---|---|
| `npx vitest run scripts/ src/` | **26 archivos · 685 pruebas · 685 pasan** · 798 ms | 685 al cierre de SAL-B2 |
| `npx eslint .` | **21 problemas: 20 errores, 1 aviso** | 21 al cierre de SAL-B2 |
| `node scripts/diagSAL.mjs sal` | **102/102 celdas OK** (17 estados × 6 viewports), `ok: true`, playwright-core 1.62.1, Chromium 153.0.4234.32 | 102/102 al cierre de SAL-B2 |

---

## Bloque H — Contradicciones

| Id | Afirmación | Dónde | Lo que la lectura dice |
|---|---|---|---|
| **H-1** | «¿Existe algún modo permanente de `diagARN.mjs`…?» | Esta ficha, G3 | `diagARN.mjs` **no existe**. Los modos ARN viven en `diagDSK.mjs`. |
| **H-2** | La Mano/Pie de la primera mano «es aleatoria» | Esta ficha, §1 | Es **fija**: asiento 0 Mano, N−1 Pie (`gameEngine.js:64-67`). No hay sorteo en código ni regla escrita en el repo (R-1). |
| **H-3** | Mano/Pie «determina reglas posteriores (orden de turno, **valor del comodín, límite de descarte**)» | Esta ficha, §1 | El orden de turno sí. **El comodín y el tope dependen del número de vivos al barajar**, no de quién es Mano (`gameEngine.js:381, :441`; `handEvaluator.js:2-6`; HR-1 §2). |
| **H-4** | «La lista canónica son cinco» y **`deck.js` no es protegido** (SAL Fase 0 §4.3: añadirle un parámetro «no requiere autorización») | `AJILEI_Protegidos_v1.0.md` §2 (v1.3, 2026-08-26); SAL Fase 0 §4.3 | `AJILEI_Modos_y_Asistencia_v1.0.md` §7 (`:476-510`, 2026-08-14) declara **otra** lista de cinco —**con `deck.js`, sin `gameTable.css`**— y una **excepción pre-autorizada** para sembrar el azar de `deck.js`. La v1.1 (`:467, :494`) lo repite. Protegidos v1.3 no lista `deck.js`, **no registra que se retirara** y su columna de autoridad no cita a Modos §7. Protegidos §5 dice que manda él, pero el conflicto nunca se cerró por escrito. **MOT-1 necesita tocar justo el barajado.** |
| **H-5** | Empaquetar el motor «deja fuera a `aiPlayer.js` por *tree-shaking* si nada lo importa» | SAL Fase 0 §4.11, punto 1 | Falso. `gameEngine.js:3` lo importa y **`applyDiscard` (que PvP necesita) llama a `decideDiscard` (`:502`)**. Ningún empaquetador puede quitar la IA de un bundle que incluya `applyDiscard`. |
| **H-6** | «Impurezas: CERO» y «el motor es una función pura del estado» | SAL Fase 0 §4.1, §4.6 | Cierto para `gameEngine.js` como archivo. Falso para lo que alcanzan sus exports: `applyAIBetAction` y `applyDiscard` pasan por el **estado de módulo** de `aiPlayer.js:461-489` y por `Math.random`, y `startHand` depende de `Math.random` (`deck.js:45`). El `grep` de §4.1 no buscaba variables `let` de módulo. |
| **H-7** | `supabase/` «contiene únicamente `migrations/0001…`» y «uso actual de Realtime: CERO» | SAL Fase 0 §1.4, §1.5 | Era cierto entonces; hoy hay `config.toml`, 5 migraciones y `SalaEspera` suscrito (F2, F5). Se anota para que nadie reutilice esas frases. |
| **H-8** | Instantánea de protegidos, columna `sha256 (16)`: `cad9af74e51e474e` (gameEngine), `9135fe06d0a5d2c0` (aiPlayer), `149591867769ad91` (gameTable.css) | `AJILEI_Protegidos_v1.0.md:76-80` | El `sha256` del **mismo blob de HEAD** es `0bf7c67a68770328`, `0b8da6501066c417` y `269120a496910995`. El **blob git** (`6ddadd536eb8`, `0860812af936`, `1e21371c8543`), las líneas y el último commit sí coinciden, y `git diff HEAD` sobre los cinco sale vacío: **los archivos no cambiaron; la columna sha256 no es reproducible** para esos tres. Causa probable: medida sobre una copia con CRLF alrededor de GIT-1 (`.gitattributes`, 2026-08-26). **No determinable por lectura.** |
| **H-9** | `DEAL_2`/`DEAL_3` «reserved for deal animation»; `SHOWDOWN` como fase | `gameEngine.js:8, :10, :14` | `DEAL_2`/`DEAL_3` son fases reales que ya llevan las cartas repartidas (`:230, :436`). **`SHOWDOWN` no se asigna nunca**: `doShowdown` va directo a `PAYOUT` (`:135`). Solo lo enumeran tres pruebas. |
| **H-10** | «Local copy to avoid circular import with gameEngine.js (which also exports maxDiscard)» | `aiPlayer.js:4` | No hay copia local de `maxDiscard` en `aiPlayer.js`: lee `state.handRules.maxDiscard` (`:625, :879`). Comentario huérfano. |
| **H-11** | Desempate «por ser la Mano» si `winner === manoIndex` | `AJILEI_Mensajes_Resultado_v1.0.md:88` | El motor dice siempre «por ser el más cercano a la Mano» en N>2 (`gameEngine.js:195`). (= R-3.) |
| **H-12** | `testHandRules.test.js` — «7 tests» | `AJILEI_Reglas_Mano_Congeladas_v1.0.md` §5 | 9 casos. (= R-4.) |
| **H-13** | «MES-PvP guardará aquí el estado del motor» | `sal_a_salas.sql:101-103, :119-120` | Con `replica identity full` (`:205`), la publicación (`:852-858`), la RLS de miembro (`:257-263`) y `select('*')` + `postgres_changes` en el cliente (`salasApi.js:284-292, :310-312`), **guardar ahí el estado de hoy repartiría las manos de todos y el mazo** (D4). El plan escrito en la migración es incompatible con el requisito de separación de esta ficha (§3 D4). |
| **H-14** | «`asiento` va de 0 a 4 porque el motor indexa los asientos por posición y el 0 es la Mano de la primera mano» | `sal_a_salas.sql:145-146` | La descripción del motor es correcta, pero la tabla admite **huecos** (salidas) y el motor exige índices contiguos con `id === índice` (C5). La correspondencia silla↔índice no es directa. |

---

## §I — Riesgos (de mayor a menor gravedad)

| # | Riesgo | Sustento |
|---|---|---|
| **I-1** | **Fuga de manos y mazo** a todos los jugadores. El estado es omnisciente y el sitio previsto para guardarlo se difunde entero por Realtime y por `select`. En un juego con Heptacoins esto es el fallo que invalida todo lo demás. | D4, F5, H-13 |
| **I-2** | **Un cliente modificado fabrica fichas o juega por otro.** Montos negativos, fuera de turno y fuera de fase pasan el motor. | D5-a…k |
| **I-3** | **La API solo sabe mover al humano del asiento 0.** Apuesta con asiento 0 fijo, descarte con un único array para todos los humanos, mesa de «1 humano + IAs», y fin de mesa si quiebra el asiento 0. Arreglarlo exige abrir `gameEngine.js` (protegido) o duplicar lógica. | A3, C5, E5-6; SAL Fase 0 §4.10 (re-verificado) |
| **I-4** | **Identidad ≠ índice.** `id` tiene que ser el asiento para cobrar; las sillas de la base tienen huecos. Un mapeo mal hecho paga el pozo a otro. | C5, H-14 |
| **I-5** | **El ritmo es del cliente.** Reloj de 20 s, salto del retirado, avance tras reparto y mano siguiente viven en efectos de React. Una Edge Function responde peticiones y no tiene temporizadores: **alguien tiene que poder reclamar un vencimiento** y el servidor comprobarlo. | E2, E3, E5-1…4 |
| **I-6** | **Azar no criptográfico y sin registro**, y el estatus de protección de `deck.js` en conflicto documental. | B1-B3, H-4 |
| **I-7** | **Regla de la primera Mano sin fuente.** La primera decisión de la partida no tiene especificación versionada, y el caso límite del Pie ausente ya existe. | R-1, R-2, H-2 |
| **I-8** | **Resolución de módulos en Deno** (4 especificadores sin extensión en el protegido) e importación desde fuera de `supabase/functions/` sin verificar. | F3-1, F3-2 |
| **I-9** | **Estado de módulo de la IA** si algún día juega en el servidor: mesas cruzadas en un mismo *isolate*. | A6, E4, H-5, H-6 |
| **I-10** | **Economía desacoplada**: el motor nace con 5000 fichas y ante = apuesta de sala; la base tiene el saldo real. | E5-7 |
| **I-11** | **Textos del motor en perspectiva del asiento 0**, con desempate erróneo, si viajan desde el servidor. | D1 (`message`), R-3 |
| **I-12** | **Deriva entre copias** si se duplica: las pruebas vigilan una sola. | G2 |

---

## §J — Tres caminos

### J-1 · Motor compartido (un archivo, importado por cliente y Edge Function)

- **Se gana:** una sola verdad de reglas, que es la doctrina de HR-1 (`Reglas_Mano_Congeladas` §3: la divergencia entre regla mostrada y aplicada fue el caso CM). Las 685 pruebas siguen vigilando lo que arbitra. vs-IA sigue funcionando sin red.
- **Se paga:** abrir `gameEngine.js` para lo que no se rodea de forma aditiva (I-3, I-4, y los 4 especificadores de F3-1, que están en las mismas líneas). Verificar que el despliegue acepta importar desde `src/` (F3-2, sin verificar). La IA viaja dentro del bundle (H-5), inerte si no hay asientos IA (A6).
- **Lo favorecen:** A5 (cero contaminación), A7, D2 (JSON sin pérdida), D3 (< 4 KB), G1.
- **Lo condicionan:** F3-1/F3-2, H-4 (autorización de protegidos), I-3.

### J-2 · Motor duplicado en `supabase/functions/` con prueba de contrato

- **Se gana:** la copia del servidor se puede cambiar (seat, validación, sin IA, especificadores `.js`) **sin abrir el protegido del cliente**, y no hay dudas de empaquetado fuera del directorio de funciones.
- **Se paga:** dos motores. La prueba de contrato tiene que ejercitar **las dos copias con los mismos casos**, incluidas las rutas que la copia del servidor cambió, y eso significa que el contrato ya no es «idénticos» sino «idénticos salvo lo añadido», que es donde la deriva se esconde. Las 685 pruebas actuales solo vigilan el cliente (G2). La lista de protegidos tendría que decir qué es la copia.
- **Lo favorece:** que `gameEngine.js` sea protegido y que PvP exija cambios que vs-IA no necesita (D5, I-3).
- **Lo desfavorece:** la doctrina de fuente única de HR-1 y la historia del caso CM.

### J-3 · Motor solo en servidor (el cliente solo pinta)

- **Se gana:** cero secretos y cero reglas en el cliente de PvP; obliga a diseñar la vista por jugador desde el principio (D4).
- **Se paga:** `GameTable.jsx` (2 260 líneas) está cosido a la forma del estado. Re-anima el reparto y el descarte **comparando el estado anterior con el siguiente completo** (`buildDiscardPlan` `:199-220`, `dealSeq` `:131-140`), y cada transición la dispara una animación suya (E3). Y **vs-IA seguiría necesitando el motor en el cliente**, salvo que la IA también suba (I-9).
- **Lo descarta como camino único:** E2/E3 y la existencia de vs-IA. Como mitad de un híbrido (vs-IA con motor local, PvP con motor en servidor) **es en la práctica J-1 o J-2** según dónde viva el archivo.

---

## §K — Preguntas al rector (para Victor antes de la Fase 1)

**K-1 · ¿Se autoriza abrir `gameEngine.js`?**
- (a) Ediciones quirúrgicas y compatibles hacia atrás: exportar `applyBetAction`; asiento como parámetro; descarte por asiento; `createInitialState` con lista de jugadores (nombre, fichas); quitar la terminación de mesa atada al asiento 0; especificadores con `.js`.
- (b) No abrirlo → J-2, con los cambios en la copia del servidor.
- (c) Envoltorio sin tocar nada → descartado: no resuelve el descarte de varios humanos ni la quiebra del asiento 0 sin reimplementar reglas (SAL Fase 0 §4.10, re-verificado).
- **Recomendación: (a), con J-1.** Es la única opción que mantiene una sola fuente de reglas, las 685 pruebas siguen valiendo, y la lista de cambios es cerrada y enumerable.

**K-2 · ¿Dónde vive la validación de jugadas (D5)?**
- (a) Una capa árbitro **nueva** (archivo no protegido, pura, probada) que rechaza antes de llamar al motor: turno, fase, acción del enumerado, monto entero en rango, índices únicos 0..4 hasta el tope, jugador ni retirado ni eliminado.
- (b) Dentro del motor.
- (c) Ambas: árbitro para reglas de entrada y guardas duras mínimas en el motor (monto ≥ 0).
- **Recomendación: (c).** La capa (a) es donde van los mensajes de rechazo; el `≥ 0` en el motor cierra la fabricación de fichas por cualquier ruta futura.

**K-3 · ¿Cómo se decide la primera Mano, y dónde está escrita esa regla?**
- (a) Robo de cartas (`drawRank` sugiere «As la más baja»).
- (b) Asiento aleatorio uniforme.
- (c) Asiento 0 / anfitrión, como hoy.
- **Recomendación:** versionar primero `AJILEI_Reglas_y_Motor_v2.md` (o su equivalente) en `docs/` y aplicar lo que diga. Si la regla es el robo, `drawRank` ya existe. Decidir también qué pasa con un Pie ausente (R-2).

**K-4 · ¿`deck.js` es protegido? (H-4)**
- (a) Confirmar Protegidos v1.3: no lo es; se archiva Modos §7 con una nota.
- (b) Subir Protegidos a v1.4 con `deck.js` dentro y la excepción de siembra.
- **Recomendación:** decidirlo **por escrito en `AJILEI_Protegidos_v1.0.md`** antes de tocar el barajado. El cambio que MOT-1 necesita (fuente de azar inyectable) cabe dentro de la excepción de Modos §7.1 en cualquiera de las dos lecturas.

**K-5 · Azar del servidor**
- (a) CSPRNG (`crypto.getRandomValues`) sin semilla, **guardando el mazo barajado** de cada mano.
- (b) Semilla registrada + PRNG determinista.
- (c) *Commit-reveal*.
- **Recomendación: (a).** El mazo ya viaja en el estado (B3), así que guardarlo da auditoría completa sin diseñar criptografía.

**K-6 · ¿Dónde se guarda el estado de la partida? (I-1, H-13)**
- (a) En `salas.estado_partida`, como dice la migración.
- (b) Tabla nueva sin lectura para clientes (sin política SELECT y fuera de la publicación de Realtime), escrita solo por el servidor. Cada jugador recibe **su vista** por Broadcast privado o por una RPC `mi_vista`.
- **Recomendación: (b).** Con (a), `replica identity full` y la política de miembro difunden la fila entera.

**K-7 · ¿Quién hace cumplir el reloj de turno? (I-5)**
- (a) El servidor escribe el vencimiento en el estado (con `ahora()`) y **cualquier cliente puede reclamarlo**; el servidor comprueba y aplica pasar/retirarse de forma idempotente. Es la doctrina de `resolver_sala`.
- (b) `pg_cron`.
- (c) Función programada.
- **Recomendación: (a).** Ya está probada en SAL y no añade infraestructura.

**K-8 · ¿La IA juega en el servidor en MOT-1?** (La ficha §2 lo deja abierto.)
- (a) No: PvP solo humanos; un abandono se resuelve por el reloj.
- (b) Sí: exige resolver el estado de módulo de `aiPlayer.js` (A6), otro protegido.
- **Recomendación: (a).**

**K-9 · Economía de la mano en PvP (I-10).** ¿El ante de cada mano es la `apuesta` de la sala (100…5000), una fracción, u otra tabla? ¿Las fichas de la mesa son el saldo real del jugador (`saldo_de`) o una bolsa fija de mesa? **Sin recomendación**: es decisión de producto. Técnicamente, cualquier respuesta entra por el `createInitialState` con lista de jugadores de K-1.

**K-10 · Bancarrota en PvP.** Cuando un jugador no cubre el ante con la mesa viva:
- (a) Queda fuera y la mesa sigue.
- (b) Se acaba la mesa (lo que hoy pasa si cae el asiento 0).
- **Recomendación: (a).** Es lo que el motor ya hace con cualquier asiento que no sea el 0.

**K-11 · Sillas con huecos (I-4).**
- (a) Compactar al arrancar: índices 0..n−1 en orden de silla y una tabla `índice ↔ uid` fuera de `players[].id`.
- (b) Mantener huecos como eliminados.
- **Recomendación: (a).** (b) arrastra R-2 y los anuncios falsos de bancarrota.

**K-12 · ¿El servidor envía `message`?** **Recomendación: no.** El cliente compone la voz con `cronicaCore`/`resultadoCore`, que ya existen y ya hacen bien el desempate (R-3).

---

## §L — Estimación de la Fase 1

Supone J-1 con K-1(a), K-2(c), K-5(a), K-6(b), K-7(a), K-8(a) y K-11(a). Si Victor elige otra combinación, cambian 1b y 1d.

| Sub-tanda | Contenido | Estimación |
|---|---|---|
| **1a · Documental** | Regla de primera Mano versionada (K-3), cierre de H-4 en Protegidos, refresco de la columna sha256 (H-8), contrato de acciones y de vista | 1 – 1,5 h |
| **1b · Motor y árbitro, sin red** | Ediciones autorizadas de `gameEngine.js`; capa árbitro con validación (D5); `vistaDe(estado, asiento)`; mapeo silla↔índice. Pruebas nuevas: entradas ilegales, varios humanos, vista sin fugas (ni `deck` ni manos ajenas), ida y vuelta por JSON, quiebra de un asiento ≠ 0. Las 685 en verde. | 5 – 7 h |
| **1c · Azar** | Fuente de azar inyectable en `deck.js` (CSPRNG en servidor, `Math.random` por defecto en cliente) y registro del mazo | 1 – 1,5 h |
| **1d · Esquema** | Migración: tabla de partida sin lectura de cliente, políticas de `realtime.messages` para canales privados, RPC o función de arranque desde `jugar_ya`/`resolver_sala`; verificación viva | 3 – 4 h |
| **1e · Edge Function** | Prueba de empaquetado del motor en Deno (F3-2) **primero, como STOP si falla**; auth `uid → asiento`; acciones (arrancar, apostar, descartar, reclamar vencimiento); emisión de vistas por Broadcast privado | 6 – 9 h |
| **1f · Humo con dos sesiones** | Dos clientes reales contra la función, sin UI de mesa (esa es MES-PvP) | 2 h |
| **Total** | | **18 – 25 h** |

Con la historia de estimaciones de la casa (ARN-1: 2,5 h contra 30–60 min previstos), conviene leer esto como **3 a 4 jornadas**. **Recomiendo partirla**: 1a+1b+1c no tocan Supabase y se pueden cerrar y commitear solos; 1e empieza con la prueba de empaquetado como puerta, porque si falla cambia el camino (J-1 → J-2).

---

## Protegidos

```
$ git diff --quiet HEAD -- src/engine/gameEngine.js src/engine/aiPlayer.js src/config/seatLayouts.js \
      src/styles/opponentPanel.css src/styles/gameTable.css && echo "diff HEAD protegidos: vacio"
diff HEAD protegidos: vacio
```

| Archivo | blob git (HEAD = trabajo) | líneas | Instantánea §3 |
|---|---|---:|---|
| `src/engine/gameEngine.js` | `6ddadd536eb8` | 548 | blob ✔ · líneas ✔ · sha256 ✘ (H-8) |
| `src/engine/aiPlayer.js` | `0860812af936` | 908 | blob ✔ · líneas ✔ · sha256 ✘ (H-8) |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | 59 | blob ✔ · líneas ✔ · sha256 ✔ |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | 1084 | blob ✔ · líneas ✔ · sha256 ✔ |
| `src/styles/gameTable.css` | `1e21371c8543` | 6289 | blob ✔ · líneas ✔ · sha256 ✘ (H-8) |

**Los cinco intactos.** Se leyeron enteros `gameEngine.js` y `aiPlayer.js`. De los otros tres solo se vieron líneas sueltas que salieron en un `grep` de «Pie» y se calcularon sus hashes; no se abrieron.
