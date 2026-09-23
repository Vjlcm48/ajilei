# AJILEI · APU-1 · Fase 0 · Informe — Diagnóstico del dinero, la IA y la selección (solo lectura) · v1.0

- **Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS (macro 1: Jugar vs IAS)
- **Fase:** 0 · solo lectura · puerta de entrada a la Fase 1
- **Base:** `main` en `f9ee503` (SAL-B2 cerrada). Árbol de trabajo sin cambios propios.
- **Fecha:** 2026-09-17
- **Ficha:** `AJILEI_APU-1_Fase0_v1.0.md`
- **Informes citados y NO repetidos:** `docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md` (MOT-1 F0) y `docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md` (MOT-1 sonda)
- **Única escritura:** este archivo.

## Línea base al arrancar

| Vara | Esperado | Medido | Veredicto |
|---|---|---|---|
| `npm run lint` | 21 | **21** (20 errores + 1 aviso) | coincide |
| `npx vitest run` | 685 | **685** en 26 archivos, 0 fallos | coincide |
| `node scripts/diagSAL.mjs sal` | 102/102 | **102/102 celdas**, 0 fallas | coincide |

`diagSAL` corrió contra el servidor de desarrollo en `AJILEI_BASE=http://localhost:5199` con `VITE_AUTH_BYPASS=1`, que es donde el propio arnés declara que debe correr (`scripts/diagSAL.mjs:10-23`: las dos mitades de §8 de su ficha no pueden cumplirse a la vez y manda §8.2). No es desviación de esta fase: está escrita en el instrumento.

---

## Bloque A — El dinero dentro del motor

| # | Pregunta | Respuesta | Cita |
|---|---|---|---|
| **A-1** | ¿Dónde nacen las 5.000 fichas? ¿Cuántos sitios la repiten? | Una sola declaración, `economy.saldoInicial: 5000`, y **cinco lectores en `src/`** más tres copias fuera. Todo asiento —humano e IA— nace con esa cifra; no hay entrada, ni pila distinta por asiento. | Declaración `src/config/ajileiConfig.js:22`. Lectores: `src/engine/gameEngine.js:57` (el que decide las fichas de la mesa), `src/lib/saldo.js:43`, `src/hooks/sesionCore.js:50`, `src/components/ModeSelect.jsx:40`, `src/screens/Lobby.jsx:173`. Fuera de `src/`: literal `5000` en `supabase/migrations/20260905203158_sal_a_salas.sql:315-321` (`saldo_de`), literal en `scripts/diagCEL0.mjs:196`, y la copia entera del motor en `supabase/functions/sonda_mot1/motor/config/ajileiConfig.js:22`. |
| **A-2** | Estructura del dinero en el estado | Por jugador: `chips` (fichas) y `contrib` (lo puesto **en la ronda en curso**, no en la mano). En la mesa: `pot` (escalar único), `currentBet` (apuesta viva de la ronda), `unit` (apuesta de mesa). **No existe** «última subida», ni apuesta acumulada por mano, ni ningún campo de capas. `contrib` se pone a 0 en cada cambio de ronda. | `makePlayer` `gameEngine.js:51-53`; estado base `:68-88`; reset de `contrib`/`acted` por ronda `:210` y `:529`. |
| **A-3** | ¿Cómo entra la apuesta de mesa? ¿Sigue siendo la «unidad de 10»? | Entra como **primer parámetro de `createInitialState`**, desde la pantalla: `createInitialState(stake, numPlayers)`. `stake` es el monto que el jugador tocó en `ModeSelect`. Dentro del motor se llama `unit` y es el **ante que se cobra a cada vivo en cada mano**. La unidad de 10 (`DEFAULT_UNIT = AJILEI_CONFIG.betting.entrada`) **sólo se usa cuando se llama sin argumentos**: en la app nunca ocurre; vive en fixtures de prueba. | `GameTable.jsx:306` (creación con `stake`); `gameEngine.js:20` y `:56`; cobro del ante `:413-418`; `App.jsx:451` pasa `stake`; `ModeSelect.jsx:111` `onSelectMode(mesa, monto)`. Lo confirma `scripts/bancoNiveles.mjs:31-33`: «el 10 de las fixtures de testAI no existe en la app — allí `unit` es el stake». |
| **A-4** | ¿Sobre qué base se calcula cada multiplicador? ¿Quién lo llama? | **Sobre la apuesta de mesa** (`unit`), y **sólo en la pantalla**: `const val = unit * mult`. El motor nunca calcula un multiplicador. Y **los multiplicadores de hoy son ×1 · ×2 · ×5 · ×10**, no 2×/3×/5×/10× (ver §I-4 en L-1). El valor elegido viaja como `betAmount` y es el **incremento** de la subida, no el total: `subir` pone `currentBet + betAmount`. | Botones `GameTable.jsx:1913-1932` (la lista literal `[1, 2, 5, 10]` está en `:1919`); `raiseTo = currentBet + betAmount` `:975`; `act()` `:978-982`; en el motor `subir` → `newBet = currentBet + amount` `gameEngine.js:285`. |
| **A-5** | ¿Quién atenúa un multiplicador? | **Sólo la pantalla**, con un `disabled={val > playerChips}` sobre el saldo del humano. No existe `puedeCubrir` ni nada equivalente en el motor. Las cuatro legalidades de acción (`canPass/canBet/canCall/canRaise`) también son de pantalla. | `GameTable.jsx:1925` (el `disabled`); `:972-976` (las cuatro legalidades). Concuerda con MOT-1 F0 §D5, último párrafo. |
| **A-6** | Ruta exacta del «no cubre» | **Retiro forzoso, en tres guardas seguidas al entrar en `applyBetAction`**, antes del `switch`. Si hay algo que igualar y no alcanza → la acción se reescribe a `'retirarse'`; si `apostar` no cubre el monto de apertura → `'retirarse'`; si `subir` no cubre el total `(currentBet + amount) − contrib` → `'retirarse'`. Detrás hay un **clamp duro** `chips = Math.max(0, chips)` declarado como garantía matemática. **No existe ningún concepto de pozo lateral**: `pot` es un escalar y `resolveWinner` se lo da entero a un único ganador. `allInEnabled: false` en config **no lo lee nadie**. | Guardas `gameEngine.js:255-262`; clamp `:301`; `pot` escalar `:81`, `:303`, `:131-135`; espejo en la IA `aiPlayer.js:664` y `:670`; `allInEnabled` `ajileiConfig.js:18` sin lectores. |
| **A-7** | `subidaMaximaPorAccion` y `maximoPorRonda` | Existen en `betting` con valores **50** y **100**; **no hay un solo lector**. `grep` global sobre `.js/.jsx/.mjs/.cjs` del árbol (excluidas `node_modules` y `dist`) devuelve exactamente dos coincidencias por clave: la declaración y su copia en la sonda. **No hay tabla por nivel**: son constantes únicas, no varían por Básico/Avanzado/Pro. Lo mismo vale para `subidaMinima: 10` y `allInEnabled: false`. | `ajileiConfig.js:16-18`; copia `supabase/functions/sonda_mot1/motor/config/ajileiConfig.js:16-18`. Ya medido igual en MOT-1 F0 §D5-b. |
| **A-8** | Re-subida por ronda y cierre de ronda | **Subidas ilimitadas**: nada cuenta cuántas van; lo único que frena es el saldo. La ronda cierra cuando **todos los activos han actuado y su `contrib` iguala `currentBet`**, o cuando queda **uno o ningún** activo. Toda subida marca `acted: false` a los demás activos, que es lo que obliga a otra vuelta. | `isRoundOver` `gameEngine.js:113-117`; rearme tras subida `:307-311`; llamada `:358`. |
| **A-9** | Cierre de la mano | `resolveWinner` suma **el pozo entero** a `players[winner].chips` y pone `pot: 0`. Empates: gana el **más cercano a la Mano** recorriendo asientos desde `manoIndex` (la Mano gana si empata). Si todos menos uno se retiran, el superviviente cobra sin showdown. **No hay sobrantes ni redondeos**: un solo ganador, pozo entero, aritmética entera. | `resolveWinner` `:130-136`; desempate `:157-163`; último en pie `:335-354`. |
| **A-10** | ¿Guardas de monto en `applyBetAction`? | **Ninguna.** `const amount = betAmount \|\| state.unit` no comprueba signo, ni entero, ni tope. Un monto negativo **fabrica fichas** y deja el pozo negativo; el `switch` no tiene `default`, así que una acción desconocida avanza el turno sin pagar. Medido por sonda en MOT-1, no se repite aquí. | `gameEngine.js:251`; `switch` sin `default` `:269-297`. Sondas D5a–D5k en MOT-1 F0 §D5. |

---

## Bloque B — Fases, rondas y turnos

| # | Pregunta | Respuesta | Cita |
|---|---|---|---|
| **B-1** | Nombres internos de las fases | Objeto `PHASES` de 10 claves, cadenas iguales a su nombre. Con apuesta: **`BET_1`** («a las 2»), **`BET_2`** («a las 3»), **`BET_3`** («al descarte»). Sin apuesta: `WAITING`, `DEAL_2`, `DEAL_3`, `DISCARD`, `SHOWDOWN`, `PAYOUT`, `GAME_OVER`. **`SHOWDOWN` nunca se asigna**: `doShowdown` salta directo a `PAYOUT`. Transiciones: `startHand`→`DEAL_2`; `advanceFromDeal` `DEAL_2→BET_1` y `DEAL_3→BET_2`; `advanceBettingPhase` `BET_1→DEAL_3`, `BET_2→DISCARD`, `BET_3→PAYOUT`; `applyDiscard` `DISCARD→BET_3`. | `PHASES` `gameEngine.js:6-17`; `advanceBettingPhase` `:205-246`; `advanceFromDeal` `:456-471`; `applyDiscard` `:525-534`. |
| **B-2** | Orden de turno y **punto de inserción del salto de all-in** | Abre siempre la **Mano** (`activePlayerIndex = manoIndex` al abrir cada ronda). El índice avanza con `nextActiveIndex`, que recorre asientos y **salta a quien tenga `folded === true`**. Ese es el único predicado. **Punto de inserción:** `nextActiveIndex` (`:120-127`) e `isRoundOver` (`:113-117`) — las dos funciones tendrían que mirar además «está en all-in». **No sirve el mismo predicado que el retirado**: un all-in sigue compitiendo por el pozo (cobra si gana) y sigue descartando, mientras `folded` significa fuera de la mano; reutilizar `folded` haría que el all-in perdiera el pozo. Hace falta una marca nueva por jugador. | `nextActiveIndex` `:120-127`; apertura de ronda `:211` y `:532`; `activePlayers` (filtra `folded`) `:92-94`. |
| **B-3** | ¿Existe hoy «queda un solo jugador con fichas»? | No como tal. Existen **dos condiciones vecinas y distintas**: (a) `isRoundOver` devuelve `true` cuando queda **≤1 activo** (`:115`), y `applyBetAction` cierra la mano si tras un retiro queda **un solo no-retirado** (`:336-337`); (b) `startHand` termina la **mesa** si quedan ≤1 **vivos** (no eliminados) (`:385-398`). Ninguna mira fichas dentro de la mano. El sitio natural de «la última ronda de apuestas no existe» es **`isRoundOver`**, que es la única función que decide que una ronda ya no tiene nada que hacer. | `:113-117`, `:335-354`, `:385-398`. |
| **B-4** | ¿El descarte depende del dinero? | **No, en absoluto.** `applyDiscard` no lee ni escribe `chips`, `pot` ni `currentBet`; recorre Mano→Pie, salta a los `folded`, recorta al tope congelado y repone del mazo. `toggleDiscard` tampoco. Un jugador en all-in podrá descartar sin tocar una línea de esta función. | `applyDiscard` `:486-535` (ninguna aparición de `chips`/`pot`); `toggleDiscard` `:538-548`; tope congelado `:489` y `:541`. |
| **B-5** | ¿Qué decide el ritmo que dependa del dinero? | Una sola decisión, y es la del **reloj de 20 s**: al llegar a 0 el humano **pasa si no hay apuesta viva y se RETIRA si la hay**. No iguala nunca. El descarte vencido manda array vacío. El retardo de la IA es fijo (`AI_ACTION_MS = 900 × 1,25 = 1125 ms`) y no mira dinero. | Reloj `GameTable.jsx:714-733`, la decisión en `:726`; `TURN_TIME = 20` `:53`; `AI_ACTION_MS` `:60`. |

---

## Bloque C — La IA (`aiPlayer.js`)

| # | Pregunta | Respuesta | Cita |
|---|---|---|---|
| **C-1** | Exports y quién los llama | Siete: `decideBetAction(state, aiIndex)` `:650`, `decideDiscard(state, aiIndex)` `:875`, `initPersonalities(numPlayers)` `:501`, `getPersonalityName(aiIndex)` `:512`, `_resetForTesting()` `:517`, `_CURVAS_PARA_TEST` `:424`, `_DIAG_PRO` `:479`. En producción **sólo el motor llama**: `applyAIBetAction` → `decideBetAction` (`gameEngine.js:481`) y `applyDiscard` → `decideDiscard` (`:502`). Ni la pantalla ni ningún hook importan `aiPlayer`. Los otros cinco exports son de pruebas y del banco. | `gameEngine.js:3`, `:481`, `:502`; sin otros importadores en `src/`. |
| **C-2** | ¿Qué ve la IA? | **Recibe el estado entero** (es el mismo objeto omnisciente que describe MOT-1 F0 §D4), pero **no lee las cartas de nadie más**. Las seis únicas lecturas de `.cards` del archivo son todas sobre `ai.cards`, las suyas. De lo ajeno lee sólo lo público: `folded`, `contrib`, `chips`, `isHuman`, `id`. Y, sólo en Pro, **`state.deck.length` y nada más** — nunca su contenido, lo que la red de pruebas exige con una trampa Proxy. **El diseño «10× honesto» es honesto de verdad**; el riesgo es de oportunidad, no de hecho: nada en el archivo impide que una línea futura mire una carta ajena. | `.cards`: `aiPlayer.js:90, 91, 660, 693, 882, 886`. `state.deck`: `:601` y `:617` (sólo `.length`). Lecturas ajenas: `:709`, `:762-764`, `:629-637`. Trampa Proxy: `scripts/testNivel2.test.js` §8. |
| **C-3** | Puntaje de mano: ¿misma función que el motor? | **La misma, del mismo módulo.** `getBestSuitScore` e `isAjilei` se importan de `./handEvaluator.js` tanto en la IA como en el motor. **No hay copia.** | `aiPlayer.js:1` y `gameEngine.js:2`; ambos → `src/engine/handEvaluator.js:8` y `:38`. |
| **C-4** | Tabla de decisión actual | Dos capas apiladas. **(1) Temperamento** — cuatro perfiles repartidos por asiento, con umbrales en puntos: `CONSERVADORA {open 32, call 22, raise 40, noise 0}`, `EQUILIBRADA {28, 18, 34, 0}`, `AGRESIVA {22, 13, 28, 0}`, `IMPREDECIBLE {28, 18, 34, noise 0,15}`. A cada uno se le suma `opponentAdj = (rivales activos − 1) × 2` y `posAdj = −2 si es Pie / +1 si es Mano / 0`. **(2) Nivel** (`state.nivelIA`, rango Básico 0 · Avanzado 1 · Pro 2): Avanzado abre la corrección por comodín ③ y la matemática de bote ④; Pro añade la lectura de descartes ②, el farol ⑥ y el Ajilei disimulado. Por ronda, con `scoreEf` = puntaje corregido: **sin apuesta** → `apostar` si `scoreEf ≥ openMin` y alcanza, si no `pasar`. **BET_1** → `subir` si `≥ raiseMin`; si hay bote y es Avanzado+, `igualar`/`retirarse` según `pagaElBote`; si no, `igualar` si `≥ callMin` o si `toCall ≤ unit×2`; si no, `retirarse`. **BET_2** → igual, con `subir` sólo el **60 %** de las veces y el listón de igualada en `callMin + 4`. **BET_3** → igual, con `subir` el **70 %** y el farol envolviendo los retiros. `pagaElBote` es `toCall ≤ 0 \|\| eqMano ≥ toCall / (bote + toCall + porIgualar)`. **El multiplicador no se elige nunca** (ver C-5). | Perfiles `aiPlayer.js:13-18`; ajustes `:709-718`; rangos `:39-45`; sin apuesta `:829-839`; BET_1 `:842-848`; BET_2 `:851-857`; BET_3 `:863-869`; `pagaElBote` `:759-767`. |
| **C-5** | ¿La IA inicia alguna vez un 10×? | **Nunca, y no puede.** No hay rama de monto en todo el archivo: `decideBetAction` devuelve `{ action }` y nada más. `applyAIBetAction` aplica **siempre `state.unit`**, es decir el ×1, e **ignora cualquier monto** que la IA devolviera. La experiencia de Victor queda **confirmada por lectura**, con la precisión de que tampoco «responde» un 10×: cuando iguala paga lo que deba, y cuando sube, sube exactamente una unidad sobre la apuesta viva, venga de donde venga. | `gameEngine.js:482`; retornos de `decideBetAction` `:654, 664, 698, 701, 831, 836, 838, 843-847, 852-856, 864-868, 871-872`. |
| **C-6** | Aleatoriedad y semilla | Usa `Math.random` en **seis sitios**, **sin semilla y sin forma de fijarla**: `:494` (barajado del reparto de perfiles), `:644` (jitter de IMPREDECIBLE), `:696` (dado del disimulo del Ajilei), `:803` (dado del farol), `:852` (dado 0,6 de subida en BET_2), `:864` (dado 0,7 en BET_3). Se suma un **séptimo eje fuera del archivo**: `shuffleDeck` en `deck.js:45`. Las pruebas los fijan con `vi.spyOn(Math, 'random')`; el banco no los fija y lo declara como límite conocido. **Para simular reproducible hacen falta las dos siembras**, y sólo una está pre-autorizada (ver §I-2). | Los seis, listados arriba; `scripts/bancoNiveles.mjs` lo declara en su salida: «sin siembra: Math.random sin semilla en baraja y en IA». |
| **C-7** | Tiempo de decisión | Vive **en la pantalla**, no en el motor ni en la IA: un `setTimeout(..., AI_ACTION_MS)` con `AI_ACTION_MS = 900 × AI_SPEED_FACTOR(1,25) = 1125 ms`. **Es fijo**, el mismo para todos los asientos, niveles y fases. **Sí se congela** con `useCongelado`: el efecto sale en su primera línea mientras la pestaña está oculta y se reprograma entero al volver. | `GameTable.jsx:60` (constante), `:906-923` (efecto y guarda `if (congelado) return`). |
| **C-8** | ¿Algo persiste entre manos? | **Sí, y es importante corregirlo: hay cinco piezas de estado de módulo vivas.** `_assignments` (perfil por asiento), `_lastNumPlayers`, `_lastHandCount`, `_lastAliveCount` y `_descartes` (memoria de la ronda de descarte, sólo Pro), más el objeto mutable `_DIAG_PRO`. Los perfiles **se reparten por partida, no por mano**, y sobreviven a todas las manos de una mesa; el detector de «partida nueva» son dos señales del estado (`handCount` retrocede o `aliveCount` sube). `_descartes` nace y muere **con la mano**. Nada de esto es un contador de conducta ni un modelo de rival: no hay memoria de lo que hizo nadie. | `:461-471` (las variables), `_ensurePersonalities` `:563-574`, `_olvidarDescartes` `:473`, `_DIAG_PRO` `:479-489`. Ya señalado en MOT-1 F0 §A6. |
| **C-9** | ¿Cómo sabe la IA cuánto dinero hay? | Lo suyo, por `ai.chips` (dos usos: la guarda de igualada `:664` y `canAffordRaise = ai.chips ≥ toCall + unit` `:670`, más las dos guardas de apertura `:831` y `:832`). **Lo ajeno sí lo mira, y en dos sitios**: `porIgualar` suma lo que cada vivo aún debe topado por **sus** fichas (`:762-764`) y el **bote** `state.pot` gobierna `pagaElBote` y el respaldo del farol (`:759`, `:800-801`). O sea: **la matemática de bote de Avanzado+ ya lee saldo ajeno y tamaño de pozo**. Básico no: con `avanzado === false`, `boteDecide` es falso y toda esa rama queda muerta. | `:664, 670, 759-767, 798-803, 831-832`. |
| **C-10** | ¿Importa algo de navegador, React, Howler o Node? | **No. Dos imports y ninguno más:** `./handEvaluator.js` y `./deck.js`, los dos puros. Ni `react`, ni `window`, ni `document`, ni `howler`, ni `node:*`. **La puerta de la simulación en Node está abierta** — y de hecho ya se usa (G-4). | `aiPlayer.js:1-2`. |

---

## Bloque D — Bancarrota, salida y fin de mesa

| # | Pregunta | Respuesta | Cita |
|---|---|---|---|
| **D-1** | ¿Qué pasa cuando una IA llega a 0? | **Se va y la mesa sigue**, exactamente como está sellado. En `startHand`, quien no puede pagar el ante (`p.chips < unit`) queda `eliminated: true` —permanente, no se resetea entre manos— y `folded: true`; `aliveCount` baja y `handRules` se recalcula con los vivos nuevos (cambia el comodín y el tope de descarte). La pantalla corre la «salida digna»: desvanecido del panel (1000 ms), aviso central (3750 ms) y reacomodo. **Ojo al matiz**: el corte no es «0 fichas», es «menos de un ante», así que un jugador puede irse con hasta `unit − 1` fichas encima. | Motor `:374-382`, `:409-410`, `:441`; ceremonia `GameTable.jsx:1310-1332`, constantes `:66-67`; el residuo `5000 mod unit` está tabulado en `docs/AJILEI_Victory_Celebration_v1.1.md:222-231`. |
| **D-2** | ¿Qué pasa cuando el humano llega a 0? | Dos rutas. Si al quebrar quedan **≤1 vivos** → `GAME_OVER` con mensaje de fin de mesa. Si quedan **≥2 vivos** el motor también devuelve `GAME_OVER` («Te quedaste sin fichas»), pero **la pantalla no lo compromete**: `beginHand` detecta el caso, deja la mesa congelada en el estado anterior y abre un modal bloqueante con «Volver al lobby» y dos botones `Próximamente` (ver vídeo / comprar). Es el hueco natural donde encaja la recarga. | Motor `:385-406`; pantalla `beginHand` `GameTable.jsx:1294-1302`; modal `:2236-2257`. Es el I-3 de MOT-1: en PvP esto no puede quedarse así. |
| **D-3** | Resultado final de la mesa | Se **compara contra las 5.000 iniciales**: `fichasNetas(chips) = chips − AJILEI_CONFIG.economy.saldoInicial`. La derrota pinta `.game-over-screen` con el texto del compositor; la victoria de mesa pinta `PantallaVictoria` con `netas`, `saldo = human.chips` y `puntos = manosGanadas × puntosDe(nivelIA)`. El documento rector de la celebración **prohíbe expresamente** derivar el saldo por fórmula y manda leerlo del estado. | `sesionCore.js:49-51`; `GameTable.jsx:1766-1773`; `puntosDe` `niveles.js:75-77`; la prohibición, `AJILEI_Victory_Celebration_v1.1.md:220-235`. |
| **D-4** | ¿Qué se persiste al terminar? | **Nada.** `sesionCore` lo declara: «SIN PERSISTENCIA, deliberado». No hay escritura a `localStorage` ni a Supabase del resultado de la mesa; los puntos de ranking se calculan para pintarlos y se pierden. **`saldo_de` no interviene en la mesa vs IA**: su único consumidor es el SQL de salas (regla 5×). El saldo real y el de la mesa son dos mundos que todavía no se tocan. | `sesionCore.js:9-11`; `saldo_de` usado sólo en `sal_a_salas.sql:446, 599` y las migraciones posteriores; `src/lib/saldo.js:42-44` sólo lo leen las tres pantallas de salas y `BarraSuperior`. |
| **D-5** | ¿Existe «abandonar la mesa»? | **Sí**, la ✕ de la cabecera abre un modal de confirmación («Perderás el progreso de esta mano») y llama a `onLeave()`, que devuelve a `mode-select`. **Con las fichas no hace nada**: el componente se desmonta y el estado del motor muere con él. Hay un `// TODO: sync balance to Supabase (Step 7)` justo en el manejador. Como el saldo es una constante, hoy «volver al saldo» y «perderlas» son indistinguibles — dejarán de serlo en cuanto exista la entrada. | `GameTable.jsx:1753` (la ✕), `:2209-2233` (modal y el TODO en `:2220`); `App.jsx:455` (`onLeave`). |
| **D-6** | «Siguiente mano» y el hueco de la recarga | Lo dispara **un botón del humano** en fase `PAYOUT`, que llama a `beginHand()` tras 300 ms. El botón **ya está gateado por cuatro condiciones** (`!isClearing && !isShuffling && !ceremony && !bankruptModal`): añadir una quinta es la forma barata de bloquearlo mientras se pregunta por la recarga. **El hueco natural existe y es exactamente ése.** | `GameTable.jsx:2000-2024`; el gate en `:2000`. |

---

## Bloque E — Saldo real y flujo de selección

| # | Pregunta | Respuesta | Cita |
|---|---|---|---|
| **E-1** | `saldo_de` | **Constante desde SAL-A, en los dos lados.** En SQL devuelve literalmente `5000` y su comentario dice que ECO-1 la sustituye. En el cliente, `saldoDelJugador()` devuelve `AJILEI_CONFIG.economy.saldoInicial`; es el **único lector que las salas pueden importar** y lo leen `ArmarMesa`, `SalaOpciones` y `SalaEspera` vía `BarraSuperior`. **La mesa vs IA lo ignora por completo**: `GameTable` no lo importa. | SQL `sal_a_salas.sql:315-323`; cliente `src/lib/saldo.js:42-44`; consumidores `ArmarMesa.jsx:17, 65`; `BarraSuperior.jsx:44-50`. |
| **E-2** | Bono de bienvenida 1.200 | Vive en **un solo sitio del código**: `BONO_BIENVENIDA = 1200`. Lo consumen `ArmarMesa` (el aviso al anfitrión) y la constante derivada `ALCANCE_NUEVOS = apuestasAlAlcance(1200) = [100, 200]`. **No existe en SQL.** Para pasar a 2.500 se toca **una línea**, pero con **tres efectos en cadena**: (a) `ALCANCE_NUEVOS` pasa a `[100, 200, 500]` sola —está derivada a propósito—; (b) el aviso «un invitado nuevo no podrá sentarse» deja de salir en la mesa de 500 y empieza en la de 1.000; (c) **dos aserciones de prueba se caen** y hay que moverlas. | `src/config/salas.js:39-41`, derivada `:68`; consumo `ArmarMesa.jsx:126, 275-286`; texto `textos.es.js:109`; pruebas `src/config/salas.test.js:74-82`; fixture con comentario `src/dev/salasFixtures.js:209`. |
| **E-3** | Flujo actual de selección | **Tres casillas de `screen`, dos componentes.** `'nivel-select'` → `NivelSelect` (elige reto, tres botones de `NIVELES`); `'mode-select'` → `ModeSelect`, que hace **dos pasos en una superficie** —mesa (2/3/4/5) y luego apuesta (los cuatro montos del nivel)— relevándose en vez de apilarse; `'table'` → `GameTable`. Props: `NivelSelect{preseleccionado,onSelect,onBack}`, `ModeSelect{nivel,onSelectMode(players,monto),onBack}`, `GameTable{stake,numPlayers,nivel,cuenta,onLeave}`. **`localStorage`: sólo `ajilei.nivel`** (`NIVEL_KEY`). Mesa y apuesta **no se recuerdan**: viven en `useState` de `App` y mueren con la recarga. **No hay paso de «entrada»**: el rótulo «¿Con cuánto entras?» de hoy **pregunta la apuesta de mesa, no un buy-in** (ver L-2). Los IDs de `niveles.js` son `basico`/`avanzado`/`pro` y son contrato declarado. | `App.jsx:137`, `:159-164`, `:448-481`; `ModeSelect.jsx:29-120` (el rótulo en `:104`); `NivelSelect.jsx:19-59`; `NIVEL_KEY` `niveles.js:51`; contrato de IDs `niveles.js:10-13`. |
| **E-4** | `src/config/niveles.js` | Confirmado: `NIVELES` con las tres tablas —Básico `[50,100,150,250]`, Avanzado `[100,200,300,500]`, Pro `[200,400,600,1000]`—, `puntos` 1/2/3, `NIVEL_POR_DEFECTO`, `NIVEL_KEY`, y las funciones `nivelPorId`/`apuestasDe`/`puntosDe`. **Ningún otro campo de dinero.** **La fórmula del «10× top bet» para las fichas de la IA NO EXISTE**: `grep` no encuentra nada parecido, y no podía existir porque `createInitialState` da 5000 a todos por igual. `STAKE_OPTIONS = [100,200,300,500]` sobrevive en `ajileiConfig.js:1` leída sólo por `TableSelect.jsx:3`, que es **código muerto** (nadie lo monta desde LOB-1). **La lista de seis de SAL-2 vive aparte y lo declara**: `APUESTAS_PVP` en `salas.js:37`, con el comentario de que no son las de `niveles.js` ni las de `STAKE_OPTIONS`. | `niveles.js:14-77`; `ajileiConfig.js:1`; `TableSelect.jsx` sin importadores en `App.jsx`; `salas.js:32-37`. |
| **E-5** | `ArmarMesa` como componente reutilizable | **362 líneas, y el acoplamiento es alto pero está bien localizado.** Reparto medido: **~95 líneas** de cabecera/estado/efectos (1-95), **~105 líneas** de lógica exclusivamente PvP (97-200: `releerMesas`, `existeMisma`, `esUnirme`, `recuerdo`, `rotuloCta`, `pulsar`, `notaCta`), y **~160 líneas** de render, de las cuales la **carcasa reutilizable** (`BarraSuperior` + `.sal-cab` + `.sal-cuerpo` + `.sal-accion` + casa + toast) son **~70** y las **tres filas de chips** son **~93** (jugadores 233-250, apuesta 252-287, modos 289-327). La forma de una fila es idéntica en las tres: `<section class="sal-bloque">` con `<h2>` + `<div class="sal-chips">` de `<button class="sal-chip" data-accion="…" aria-pressed>`, con `disabled` opcional y una `<p class="sal-aviso">` de caja reservada O1 debajo. **Sí se puede separar**: nada del render toca `api`; `api` sólo lo usan `releerMesas` y `pulsar`. **Estimación: extraer un `FilaChips` genérico ≈ 30 líneas nuevas que sustituyen ~60, y una carcasa `PantallaChips` ≈ 70 líneas.** Lo que **no** se comparte es el estado: `ArmarMesa` guarda su config en `ajilei.salaConfig` vía `salaRecordada`, y APU-1 pide recordar tres campos y **olvidar la entrada** — una política distinta, no la misma función con otra clave. | `ArmarMesa.jsx:1-362`; filas `:233-250`, `:252-287`, `:289-327`; `api` sólo en `:108` y `:151-153`; memoria `:159` + `config/salaRecordada.js`. |
| **E-6** | Textos | **Las tres pantallas de selección no usan `t()` ni una vez**: `NivelSelect` y `ModeSelect` llevan las cadenas en el JSX («Elige tu reto», «Elige tu mesa», «¿Con cuánto entras?», «Entrada de X a Y Heptacoins»). El diccionario tiene **101 claves y sólo dos prefijos**: `lob.` (18) y `sal.` (83). **La mesa tampoco usa `t()`**: sus cadenas de dinero viven en `cronicaCore.js` (`MONEDA = 'Heptacoins'`, «Apuestas N Heptacoins.», «Igualas a N.», «Subes a N.») y en `resultadoCore.js`. Las claves `sal.*` con dinero son ocho, listadas en la cita. | Diccionario `src/config/textos.es.js` (101 entradas; claves con dinero en `:55, 78, 89, 98, 107, 108, 109, 110, 138, 148, 166, 207`); `cronicaCore.js:27, 78-90`; `resultadoCore.js:70-98`; `NivelSelect.jsx:23-47` y `ModeSelect.jsx:44-115` sin `t()`. |

---

## Bloque F — La mesa en pantalla

| # | Pregunta | Respuesta | Cita |
|---|---|---|---|
| **F-1** | Dónde se dibujan fichas y pozo | **Tres superficies por las dos vías, y el pozo duplicado.** Rival por `OpponentPanel` (mesas 5/4/3 y mesa 2 landscape): saldo inline `.opp-chips` (`OpponentPanel.jsx:106`, rama que el censo VIS-3 no encontró montada en ninguna celda) o **ficha de esquina** `.opp-corner-chip` con float `:134-142`, que es la rama viva. Rival de **mesa 2 portrait** (`.ai-zone`): `.ai-chips` en `GameTable.jsx:1477` y su float `:1529`. Humano: `.pbr-chips` `:2039`, junto a «Mesa {unit}» `:2041`. **Pozo: dos `.pot-box`**, una por camino de render —`GameTable.jsx:1635-1646` y `:1698-1709`—, cada una con «Pozo», el valor, el flotante `+N` y la caja «A igualar». Todas las cifras pasan por `saldoMostrado(i, chips)` (`:861`), que resta el pozo en vuelo al ganador. | Citas en la columna. |
| **F-2** | Componente de los botones de apuesta | **No hay componente: es JSX inline dentro de `GameTable`**, bajo `{isPlayerTurn && (...)}`. Dos filas: `.mult-row` (cronómetro + cuatro `SoundButton.btn-mult` de `[1,2,5,10]`, montos `unit * mult`, atenuados con `disabled={val > playerChips}`) y `.action-buttons` (Pasar / Apostar N / Igualar (N) / Subir a N / Retirarse, cada uno gateado por `canPass/canBet/canCall/canRaise`). **Punto donde entraría «All-in»:** en `.action-buttons`, como quinto botón con su propia condición `canAllIn` junto a las otras cuatro (`:972-976` y `:1933-1937`). El cuadro es apretado en horizontal: el documento del menú de utilidades declara que ese panel «jamás» toque `.action-buttons`, `.btn-mult` ni `.timer-display`. | `GameTable.jsx:1913-1938`; legalidades `:972-976`; la prohibición, `docs/AJILEI_Menu_Utilidades_v1.1.md:317`. |
| **F-3** | Espacio para una marca «ALL-IN» | **Hay dos cajas reservadas y ninguna libre.** (1) `.opp-status`: `<span>` que **siempre está en el DOM** (renderiza `' '` cuando no hay nada), 18 px de alto fijos, sacada de flujo en mesas 5/4/3 con `left:28px; right:2px; bottom:1px` y **~86 px útiles** —lo declara la propia hoja, que se dimensionó contra «Descartó 4» (~70 px) y «Sin fichas» (~72 px)—. Es la doctrina O1 hecha CSS. **Pero está ocupada**: pinta la última acción, «Se retiró», «Pensando…» y «Sin saldo», y ya cede el renglón por `visibility` cuando se abre el toggle de saldo. (2) `.opp-header-anchor`: `inline-flex`, `gap: 4px`, `margin-left: auto`, `flex-shrink: 0`, con el slot de TURNO **ya reservado por `visibility`** en escritorio (doctrina O1 explícita). Meter ahí un segundo badge le come ancho a `.opp-name`, que en mesas 5/4/3 ya está en `max-width: 72px` con ellipsis. Medidas del badge: `font-size 10px`, `weight 800`, `letter-spacing 1.5px`, `padding 2px 8px`, `margin-left 6px` → una «A» de letra ocupa ~22 px + 6 de margen; «ALL-IN» en extenso, ~74 px. **El hueco libre exacto en los cuatro viewports NO es determinable por lectura**: el ancho del panel (116 px en 5/4/3, 448 px en mesa 2 landscape) sale de tokens de `gameTable.css` que se resuelven en vivo. **Medir con arnés** — el modo `o1` de `diagDSK.mjs` ya mide cajas por estado real de mano. | `.opp-status` JSX `OpponentPanel.jsx:147-151`; CSS `opponentPanel.css:552-586` (el comentario con las dos cifras en `:552-562`) y `:749-762`; reserva estructural `:573-577`. Anchor `OpponentPanel.jsx:84-93`; CSS `opponentPanel.css:485-491`; slot TURNO reservado `OpponentPanel.jsx:91`. Badge `gameTable.css:980-989`. `.opp-name` `opponentPanel.css:474-484`. |
| **F-4** | `useCongelado` y un temporizador de 10 s | Congela **tres cosas**: el audio (`Howler.volume(0)` con memoria del valor previo), el **reloj de turno del humano** (por lista de dependencias: el efecto sale y el tick se limpia) y la **acción de la IA** (guarda de entrada). Además sostiene **UN** slot de continuación (`diferir`) que usan el salto del retirado, el arranque del descarte, el barajado y el «siguiente mano». **Sí podría colgarse un temporizador de 10 s del mismo mecanismo, pero por la vía de las dependencias, no por el slot**: el slot es explícitamente de uno —«Por diseño no puede haber dos a la vez»— y avisa por consola si se sobrescribe. La pregunta de recarga vive entre manos, donde ya hay dos continuaciones diferidas (barajado y siguiente mano), así que el slot es el sitio equivocado. | `src/hooks/useCongelado.js:1-90`, el aviso de slot ocupado `:88-90`; reloj `GameTable.jsx:714-733`; IA `:906-923`; usos de `diferir` `:948`, `:961`, `:1355`, `:2018`. |

---

## Bloque G — Pruebas, arnés y viabilidad de la simulación

| # | Pregunta | Respuesta | Cita |
|---|---|---|---|
| **G-1** | Pruebas sobre motor e IA | **Siete archivos, 183 de las 685 pruebas.** `testEngine.test.js` 44 (conteo de cartas, rotación Mano/Pie, orden de turno, tope de descarte, comodín, **fondos insuficientes**, regresión N=2, desempates); `testAI.test.js` 23 (personalidades, decisión, descarte, manos completas simuladas); `testEliminations.test.js` 15; `testHandRules.test.js` 9; `testNivel1.test.js` 23 (test de oro de Básico + re-derivación de curvas); `testNivel2.test.js` 40 (incluida la trampa Proxy de §8); `testNiveles.test.js` 29. **Tocan dinero: un bloque de 3** —«6. Fondos insuficientes → retiro forzoso»—, más los que comprueban `pot = unit × N` en `startHand` y `pot = 0` al cierre. **No hay ni una prueba de pozo lateral, de all-in, ni de tope de subida**: no existe lo que probar. | `scripts/testEngine.test.js:325-376` (el bloque de fondos), `:392`, `:481`; conteos por `grep -c "\bit("`. |
| **G-2** | Fixtures reutilizables | Dos fábricas de estado sintético, las dos **con dinero dentro y listas para poner un pozo a mitad de mano**: `makeState(overrides)` en `testAI.test.js:45` (completa `handRules` si falta) y `estado(over)` en `testNivel1.test.js:52`. Además, dos conductores de mano completa: `simHand`/`simBettingPhase` en `testAI.test.js:69-92` y `jugarMano`/`jugarRonda` en `bancoNiveles.mjs:253-286`. **Para la UI**, `src/dev/salasFixtures.js` (salas, no mesa) y el molde `?cel` de `siembraCEL`, que **siembra a los rivales sin fichas** — un fixture de bancarrota ya escrito. | Citas en la columna; `siembraCEL` `src/dev/siembraCEL.js`, invocado en `GameTable.jsx:306`. |
| **G-3** | Modos del arnés que juegan contra la IA | El helper **`playToShowdown(page, maxIter=200)`** de `diagDSK.mjs:401-415` **reproduce una mano completa** en el navegador: pulsa «Iniciar mano», y en bucle Pasar → Igualar → Apostar + «Sin descartar» hasta que aparece «Siguiente mano». Lo usan `o1`, `tactil`, `r1`, `r2`, `vc`, `msg` y otros; varios encadenan manos seguidas (`:2192-2203`, `:2400-2418`, `:2650-2663`). **Miden geometría, no reglas**: cajas, solapes, Δ=0, consola limpia. Ninguno comprueba una cifra de dinero. Conductor siempre pasivo: nunca sube, nunca se retira, nunca descarta. | `scripts/diagDSK.mjs:401-415` y los usos citados. |
| **G-4** | Viabilidad de un runner de simulación en Node | **Ya existe, corre hoy, y no hay obstáculo que levantar.** `scripts/bancoNiveles.mjs` encadena `createInitialState → startHand → advanceFromDeal → rondas de IA → applyDiscard → PAYOUT → siguiente mano` por la **API pública del motor**, sin React y sin un solo temporizador, con tres conductores para el asiento 0 (espejo / pasivo / aleatorio), matriz de cuatro mesas, pasajero `nivelIA` y puertas de regresión. Resuelve las dos fricciones reales por su cuenta: la extensión de los imports del motor, con el gancho `scripts/_resolveExt.mjs` (`register` antes de un `import` dinámico), y la API atada al asiento 0, con un **estado espejo** que permuta 0↔1. **Lo único que falta para calibrar APU-1 es reproducibilidad**: `Math.random` sin semilla en la baraja (`deck.js:45`) y en los seis puntos de la IA (C-6). El banco lo declara en cada corrida. **El único obstáculo de verdad, entonces, es la semilla** — y la de `deck.js` está **pre-autorizada sin ceremonia**; la de `aiPlayer.js` no (ver §I-2). | `bancoNiveles.mjs:10-14, 60-77, 246-286, 165` (el espejo); `scripts/_resolveExt.mjs`; la advertencia de siembra en la salida del banco. |
| **G-5** | Costo por mano en Node | **Medido en vivo, no estimado.** `node scripts/bancoNiveles.mjs --mesa 4 --j0 espejo --manos 5000` → **6.092.212 manos/min ≈ 101.500 manos/s**, con el proceso entero (arranque de Node incluido) en **1,017 s** de reloj. A ese ritmo, un barrido de calibración de **un millón de manos por celda** cuesta del orden de **10 s por celda**; la matriz completa 4 mesas × 3 conductores, del orden de **dos minutos**. **La simulación no es el cuello de botella de la Fase 1.** Como nota de higiene: el banco escribe su volcado en `capturas-dsk/`, que está en `.gitignore:31`, así que la corrida **no ensució el árbol** (`git status` lo confirma más abajo). | Salida de la corrida, reproducida arriba; `.gitignore:31`. |

---

## Bloque H — Sonido y textos de la mesa que tocan dinero

| # | Pregunta | Respuesta | Cita |
|---|---|---|---|
| **H-1** | Sonidos ligados a fichas | Dos en la mesa: **`coinBet`** (`/sounds/coin-bet.mp3`, vol 0,7) suena en toda acción que mueve dinero —humano en `act()` para apostar/igualar/subir, e IA cuando `next.pot > prev.pot`— y **`cardFold`** en todo retiro, incluido el del reloj vencido. **`chipsCollect` NO es de la mesa**: pertenece a la celebración (`celebracionCore` lo elige para los niveles `mano` y `recoleccion`) y a las salas (`SalaEspera.jsx:366`), y está fuera de `SONIDOS_MESA` a propósito. **Un all-in puede reutilizar `coinBet` sin pedir asset nuevo**; una recarga entre manos encaja mejor en `chipsCollect`, que ya suena a «fichas que llegan» y ya está precargado en el camino sala→mesa. | `useSounds.js:24-25, 28, 37, 61-65, 103-112`; disparos `GameTable.jsx:916-917, 979-980, 725`; celebración `celebracionCore.js:96-100`. |
| **H-2** | Mensajes de mesa que mencionan dinero | El motor escribe los suyos (`Apuestas N fichas.`, `Igualas a N.`, `Subes a N.`, `Te retiras. La IA gana el pozo.`) pero **el óvalo ya no los pinta**: desde REN-2 la voz es `cronicaCore` + `resultadoCore`, que es como la moneda pasó de «fichas» a «Heptacoins» sin abrir el motor. Las cadenas vivas son `MONEDA = 'Heptacoins'` y las cinco del `switch` de crónica, más las de resultado. **Ninguna habla de retiro forzoso**: cuando el motor fuerza un retiro por falta de saldo, el jugador lee exactamente el mismo texto que si se hubiera retirado a voluntad. Ese silencio es un hallazgo: la regla más dura del dinero es hoy la única que no se anuncia. | Motor `gameEngine.js:314-333`, `:172-199`, `:515-523`; voz viva `cronicaCore.js:27, 74-91`, `resultadoCore.js:59-98`; la declaración de que el óvalo no pinta `game.message`, `GameTable.jsx:298-302`. |

---

## Bloque I — Contradicciones documentales y lo que MOT-1 necesita

### I-1 · Documentos vivos que contradicen el código

`AJILEI_Reglas_y_Motor_v2.md` **sigue sin existir** en el repositorio y **no tiene sucesor**: ningún documento de `docs/` describe las reglas de apuesta de forma normativa. Lo que sí hay son **dos afirmaciones sueltas que contradicen el código**, las dos en documentos vivos:

| # | Documento | Lo que dice | Lo que hace el código |
|---|---|---|---|
| **I-1a** | `AJILEI_Modos_y_Asistencia_v1.0.md:218` | «**Costo único por partida.** El ganador se lleva el **pote = monto × jugadores**» — modela la apuesta como un buy-in de una vez, con un pozo único y un ganador de partida. | El monto es el **ante de CADA mano** (`gameEngine.js:413-418`), se cobra tantas veces como manos se jueguen, y el pozo se reparte **por mano**. La tabla de «pote máximo 5000» de `:228-234` sólo describe la **primera** mano. El propio proyecto ya lo contradice en otro sitio: `AJILEI_Victory_Celebration_v1.1.md:222-231` razona sobre `5000 mod unit` precisamente porque el ante se cobra mano a mano, y el texto de PvP dice «**{hc} HC por mano**» (`textos.es.js:78, 98`). |
| **I-1b** | La misma tabla, `:226-234` | El nivel Pro con la mesa alta produce «pote máximo 5000», igual al saldo de arranque, y lo anota como consecuencia aritmética. | Bajo el modelo real (ante por mano) la cifra no acota nada: el pozo de una mano cualquiera puede superarla en cuanto alguien sube dos veces. La nota es correcta sólo para la mano 1 con todos pasando. |

**No es una contradicción sobre la que APU-1 tenga que decidir nada**: el modelo que Victor ya selló —entrada por partida **más** ante por mano **más** recarga— resuelve las dos. Lo que hace falta es que la Fase 1 **actualice ese párrafo**, porque hoy un lector del rector diseñaría la economía equivocada.

### I-2 · Estado del conflicto H-4 de MOT-1 — **sigue igual, y es más grande de lo que MOT-1 dijo**

Nadie lo ha resuelto. Y medido entero, las dos listas no discrepan en un archivo sino en **dos**:

| Lista | Los cinco |
|---|---|
| **Canónica** `AJILEI_Protegidos_v1.0.md` v1.3 §2 | `gameEngine.js` · `aiPlayer.js` · `seatLayouts.js` · `opponentPanel.css` · **`gameTable.css`** |
| `AJILEI_Modos_y_Asistencia_v1.0.md:479-487` §7 | `gameEngine.js` · `aiPlayer.js` · `seatLayouts.js` · `opponentPanel.css` · **`deck.js`** |

La canónica dice de sí misma que es **la única autoridad** y que «una instrucción de campaña puede *recordar* la lista, pero no ampliarla ni recortarla por su cuenta» (§5). `Modos_y_Asistencia` §7 se declara **ampliación** que los otros documentos «heredan en su próximo salto natural de versión» — un salto que no ocurrió. Resultado práctico: **`deck.js` está protegido según un documento y no según el que manda**, y `gameTable.css` al revés.

**Y esto no es trivia documental para APU-1**, porque §7.1 del mismo documento contiene lo siguiente:

> **Excepción pre-autorizada — única, y sólo para `deck.js`:** «**Siembra del azar** (`seed` / PRNG inyectable) **al servicio del banco de simulación**. Autorizada de antemano: no requiere ceremonia.»
> Y a continuación: «**La siembra gemela de `aiPlayer.js`** … **no** está pre-autorizada: viaja con la ceremonia normal de NIV-1/NIV-2, que son las tandas que abren ese archivo de todos modos.»

Es decir: **la mitad de la reproducibilidad que G-4 necesita ya está autorizada, y la otra mitad depende de una autorización que APU-1 va a pedir igualmente** (abre `aiPlayer.js` para los umbrales). Conviene que la Fase 1 lo cobre en el mismo gesto.

En la misma sección §8, el documento registra **deuda de motor** que APU-1 hereda: no existe pila de descartes, y **la IA nunca se llama en `SHOWDOWN` ni `PAYOUT`** — sus dos únicos puntos de invocación son la apuesta y el descarte.

### I-3 · Lo que MOT-1 hereda: funciones del motor que APU-1 cambia de firma o de semántica

MOT-1 Fase 1-0 fijó **seis ediciones** al motor (K-1(a)). APU-1 toca **cinco de las seis**, y en tres de ellas va más allá:

| Edición de MOT-1 | Estado tras la sonda | Qué le hace APU-1 | Cita del punto |
|---|---|---|---|
| 1 · exportar `applyBetAction` | pendiente | **La misma edición sirve a las dos**, pero APU-1 le cambia la **semántica**: el «no cubre» deja de ser retiro forzoso y pasa a ser all-in con capas. El árbitro heredará la función ya corregida. | `gameEngine.js:249-361`, guardas `:255-262` |
| 2 · asiento como parámetro | pendiente | Sin cambio adicional. APU-1 no lo necesita (el humano sigue siendo el 0 en vs-IA) pero tampoco estorba. | `:474-476` |
| 3 · descarte por asiento | pendiente | Sin cambio. Confirmado en B-4: el descarte no toca dinero, así que el all-in no lo afecta. | `:486-535` |
| 4 · `createInitialState` con lista de jugadores | pendiente | **Cambio de firma, y es el mayor.** Hoy `(unit, numPlayers)` da 5000 a todos; APU-1 necesita **fichas por asiento** —entrada del humano, entrada+1000 topada para cada IA—. Es exactamente la lista de jugadores que MOT-1 pide, con el campo de fichas dentro. **Las dos campañas quieren la misma edición**: conviene que la escriba una sola. | `:56-89` |
| 5 · quitar la terminación de mesa atada al asiento 0 | pendiente | **APU-1 la necesita para su propio caso**: la recarga sólo tiene sentido si quebrar no termina la mesa. Hoy `players[0].eliminated` con ≥2 vivos devuelve `GAME_OVER` y es la pantalla la que lo desobedece con un modal. | `:399-406`; el parche `GameTable.jsx:1294-1302` |
| 6 · especificadores con `.js` | **necesaria** (P2 de la sonda) | Sin cambio. Inocua para Vite y Vitest; la confirmarán las 685. | `gameEngine.js:1-4` |

**Ediciones que APU-1 añade y MOT-1 no tenía previstas** —las que el contrato del árbitro tendrá que absorber—:

| # | Qué | Dónde | Por qué el árbitro lo hereda |
|---|---|---|---|
| **N-1** | **`pot` deja de ser escalar** y pasa a ser capas (`pot` + pozos por capa con su lista de elegibles). | `gameEngine.js:81, 303, 131-135, 413-418` | Cambia la forma del estado que viaja por la red y la del pago. Es el cambio de mayor superficie de toda la campaña. |
| **N-2** | **`resolveWinner` y `doShowdown` reparten por capas**, no un pozo entero a un ganador. | `:130-136`, `:139-202` | El árbitro emite el resultado; si reparte mal, reparte mal para todos. |
| **N-3** | **Marca de all-in por jugador** y su predicado en `nextActiveIndex` e `isRoundOver`. | `:113-117`, `:120-127` | Es lo que decide de quién es el turno: sin ello el árbitro se queda esperando a alguien que no puede actuar. |
| **N-4** | **Legalidad del monto dentro del motor** (signo, entero, tope). Hoy no existe y vive en la pantalla. | `:251`, `:269-297`; pantalla `GameTable.jsx:972-976` | Es literalmente el punto 5 de la tabla E5 de MOT-1 F0: «el motor acepta cualquier cosa». APU-1 puede cerrarlo de paso. |
| **N-5** | **Recarga entre manos**: una entrada de dinero nueva a mitad de mesa. | `startHand :367-453` | El árbitro tendrá que autorizarla o rechazarla, y eso es una acción de red que hoy no existe en ningún contrato. |

---

## §J — Riesgos

| # | Riesgo | Prob. | Impacto | Sustento |
|---|---|---|---|---|
| **R-1** | **Abrir `gameEngine.js` y `aiPlayer.js` a la vez.** Son los dos archivos más protegidos del proyecto y APU-1 los necesita los dos. Un fallo de conducta de la IA y un fallo de reparto del pozo se confunden entre sí: los dos se manifiestan como «alguien ganó lo que no debía». | **Alta** (es certeza, no riesgo: la campaña no se puede hacer sin ellos) | **Alto** | Todo el Bloque A y el Bloque C. La mitigación existe y está escrita: `bancoNiveles.mjs --bandas` es «la alarma anti-degradación de toda tanda que toque `aiPlayer.js`» (`bancoNiveles.mjs:42-45`), y las 183 pruebas de motor/IA (G-1) cubren el otro lado. **Recomendación: separar las dos aperturas en sub-tandas distintas con la vara corriendo entre medias.** |
| **R-2** | **Que la vista de la IA incluya cartas ajenas.** | **Baja** | **Alto** | **Medido y descartado como hecho**: C-2 confirma que las seis lecturas de `.cards` son propias y que de `state.deck` sólo se lee `.length`. El riesgo **residual** es de oportunidad: la IA recibe el estado entero y nada estructural le impide mirar. APU-1 añade ramas nuevas (umbrales por tamaño de mesa, farol, cuarto del pozo) y cada rama nueva es una ocasión. **Mitigación ya escrita: la trampa Proxy de `testNivel2.test.js` §8 — extenderla a las ramas nuevas cuesta poco.** |
| **R-3** | **Que el ritmo en React impida simular.** | **Nula** | — | **Descartado por medición, no por lectura**: G-4 y G-5. El runner existe, corre a 101.500 manos/s y no toca React ni un temporizador. Lo que sí queda vivo es su sucesor, R-3b. |
| **R-3b** | **Que la calibración no sea reproducible.** Siete fuentes de `Math.random` sin semilla (seis en la IA, una en la baraja). Dos corridas del banco sobre el mismo código dieron 25,17 % y 17,20 % para el mismo asiento antes de que NIV-1 arreglara el reparto de perfiles. | **Alta** | **Medio** | C-6, G-4. Sin semilla, «afinar por simulación» significa afinar contra ruido, y los umbrales 41/40/36/33 son diferencias de 1 punto. **La siembra de `deck.js` está pre-autorizada (§I-2); la de `aiPlayer.js` hay que pedirla.** |
| **R-4** | **Que la pantalla calcule multiplicadores por su cuenta y diverja del motor.** | **Media** | **Medio** | **Ya diverge hoy, en dos sentidos.** (a) El motor no calcula ningún multiplicador: `unit * mult` vive sólo en `GameTable.jsx:1919`, y `subir` interpreta ese valor como **incremento** mientras el botón lo anuncia como total («Subir a N»). (b) La ficha de APU-1 dice 2×/3×/5×/10× y el código tiene **×1/×2/×5/×10** (L-1). Cada superficie nueva —la pantalla «Retar a las IAS», el árbitro de PvP— es una tercera copia de la misma aritmética. |
| **R-5** | **Que el «no cubre» esté replicado en varios sitios.** | **Alta** | **Alto** | **Confirmado: está en cuatro sitios y cada uno decide distinto.** (1) El motor fuerza retiro, `gameEngine.js:255-262`. (2) La IA lo espeja «por seguridad», `aiPlayer.js:664` y `:670`. (3) La pantalla apaga botones, `GameTable.jsx:972-976`. (4) La pantalla apaga multiplicadores, `:1925`. Sustituir «no cubre → retiro» por «no cubre → all-in» obliga a tocar **los cuatro a la vez**; dejar uno sin migrar produce un jugador que el motor deja ir all-in y la pantalla no deja pulsar, o al revés. **Es el riesgo con más superficie de la campaña.** |
| **R-6** | **La marca de all-in no cabe donde hay sitio.** `.opp-status` está reservada (18 px, ~86 px útiles) pero **ocupada** por la última acción; el anclaje de badges ya cede ancho a un nombre con ellipsis a 72 px. | **Media** | **Bajo** | F-3. Es un riesgo de campaña de interfaz, no de motor, y la casa ya tiene el instrumento (`diagDSK o1`). Se declara para que la Fase 1e no lo descubra a mitad. |
| **R-7** | **La recarga entre manos choca con el slot único de `useCongelado`.** Entre manos ya hay dos continuaciones diferidas (barajado `:1355`, siguiente mano `:2018`), y el hook avisa por consola si alguien sobrescribe el slot. | **Media** | **Bajo** | F-4. Se resuelve por dependencias, como el reloj de turno, no por el slot. |
| **R-8** | **Que el texto de dinero se quede mudo donde más duele.** Hoy un retiro forzoso por falta de saldo se anuncia con la frase de un retiro voluntario. Al añadir all-in y recarga, el número de cosas que pasan sin decirse crece. | **Media** | **Medio** | H-2. Y las tres pantallas de selección **no pasan por `t()`** (E-6), así que la pantalla nueva nace con la deuda o la paga. |

---

## §K — Caminos (no se elige)

### K-1 · Dónde vive la legalidad nueva del dinero

| Camino | Qué es | Protegidos que abre | Ediciones | Qué hereda MOT-1 |
|---|---|---|---|---|
| **K-1a · Motor puro** | Capas, all-in y entrada por asiento dentro de `gameEngine.js`. | `gameEngine.js` (+`aiPlayer.js` por el Bloque C, que va aparte) | **~6 zonas**: `createInitialState :56-89`, `applyBetAction :249-361`, `isRoundOver :113-117`, `nextActiveIndex :120-127`, `resolveWinner :130-136`, `startHand :413-418`. | Lo hereda **todo y gratis**: el árbitro importa el motor tal cual. Es el camino que menos trabajo deja a MOT-1 y el que más superficie abre en el archivo más protegido. |
| **K-1b · Capa nueva importada por el motor** | Un `betting.js` (o `pozos.js`) puro y **no protegido** con la aritmética de capas; el motor lo llama. | `gameEngine.js` (sólo los puntos de llamada) | **~4 zonas** en el motor + 1 archivo nuevo | Lo hereda igual (viaja dentro del grafo, como `aiPlayer.js`), y **con una ventaja**: la aritmética queda en un archivo que cualquier tanda futura puede probar y tocar sin ceremonia. La sonda MOT-1 ya demostró que el grafo entero empaqueta con la edición 6. |
| **K-1c · Capa fuera del motor que el árbitro reutiliza** | La legalidad vive en un módulo que llaman la pantalla y el árbitro; el motor sigue siendo permisivo. | **Ninguno** para la legalidad; sigue haciendo falta abrirlo para las capas del pozo (que **no** son legalidad, son reparto). | 1 archivo nuevo + la pantalla | **Es lo que ya pasa hoy y lo que MOT-1 F0 §E5 señala como problema**: «en PvP no valen nada». Resuelve la mitad barata (validar) y deja intacta la cara (repartir por capas). Sólo tiene sentido **combinado** con a o b. |

### K-2 · Cómo se hace la simulación

| Camino | Qué es | Coste | Qué deja |
|---|---|---|---|
| **K-2a · Extender `bancoNiveles.mjs`** | Añadir modos a lo que ya existe: conductor que sube, celdas por umbral, métrica de fichas además de manos. | **Bajo** — el bucle, las puertas, el volcado y la vara sellada ya están (G-4, G-5). | Una vara comparable con las de NIV, que es justo lo que `--bandas` protege. |
| **K-2b · Runner nuevo dedicado a APU** | Un `bancoApuestas.mjs` propio para pilas, all-in y recarga. | **Medio** — duplica el bucle de mano, que es la pieza que NIV-B0 declara «misma que `simHand`, sin importar nada de un `.test.js`». | Un tercer sitio donde vive el mismo encadenado. La casa ya tiene dos (banco y `testAI`); un tercero es donde empiezan a divergir. |
| **K-2c · Modo del arnés de navegador** | Un modo `apu` en `diagDSK.mjs` sobre `playToShowdown`. | **Alto por mano** (el navegador corre a ~1 mano/segundo contra 101.500/s de Node). | Imprescindible para **ver** el all-in y la recarga en pantalla; inútil para **calibrar** umbrales. **No compite con a/b: es el otro eje.** |

La combinación que el diagnóstico sugiere sin elegirla: **K-2a para calibrar + K-2c para verificar**, con la siembra de §I-2 como precondición de la primera.

### K-3 · Cómo se reutiliza `ArmarMesa`

| Camino | Qué es | Líneas | Riesgo |
|---|---|---|---|
| **K-3a · Extraer `FilaChips` + carcasa** | Un componente de fila (~30 líneas) y una carcasa de pantalla (~70) que las dos pantallas montan. | ~100 nuevas, ~130 sustituidas en `ArmarMesa` | **`ArmarMesa` está cubierta por 102 celdas de `diagSAL`**, así que la regresión se mide en minutos. El riesgo real es que las dos pantallas necesitan **políticas de memoria distintas** (PvP recuerda su config; APU debe olvidar la entrada), y eso no se comparte. |
| **K-3b · Duplicar** | Una `RetarIAS.jsx` nueva con las mismas clases CSS. | ~250 nuevas | Cero riesgo de regresión en PvP, y la deuda de dos pieles que el proyecto ya conoce y nombra (`Menu_Utilidades_v1.5.md §7.3`: «la deuda de dos pieles son tres bloques copiados a mano y el arnés es su único guardián»). |
| **K-3c · Extraer sólo `FilaChips`** | Compartir la fila, no la carcasa. | ~30 nuevas, ~60 sustituidas | El punto medio. La fila es la pieza que de verdad se repite cuatro veces en la pantalla nueva; la carcasa (barra superior, casa, toast, CTA con nota) puede no querer ser la misma en vs-IA. |

---

## §L — Preguntas al rector

**L-1 · Los multiplicadores: ¿×1/×2/×5/×10 (lo que hay) o 2×/3×/5×/10× (lo que dice la ficha)?**
La ficha sella «Multiplicadores 2×/3×/5×/10× … no se tocan», pero el código tiene `[1, 2, 5, 10]` (`GameTable.jsx:1919`). No son lo mismo: hoy existe un ×1 —subir exactamente una apuesta de mesa, que es además **la única subida que la IA sabe hacer** (C-5)— y no existe el ×3. Quitar el ×1 le quita a la IA su única acción de subida; ponerle el ×3 sin darle elección de monto no cambia nada de su conducta.
*Opciones:* (a) el código manda, la ficha se corrige a ×1/×2/×5/×10; (b) la ficha manda y hay que cambiar la fila **y** decidir con qué sube la IA; (c) cinco botones ×1/×2/×3/×5/×10.
*Recomendación del ejecutor:* **(a)** — el ×1 es el suelo del juego y la ficha ya dice que esto «no se toca»; lo más probable es que el 2×/3× fuera un recuerdo aproximado.

**L-2 · ¿La entrada por partida sustituye al ante por mano, o convive con él?**
El código cobra el `stake` **como ante de cada mano** (A-3) y elimina a quien no lo cubre. La entrada nueva es un buy-in de una vez. `Modos_y_Asistencia_v1.0.md:218` describe la apuesta como «costo único por partida», que es un tercer modelo y contradice al código (§I-1a).
*Opciones:* (a) conviven — la entrada compra fichas y el ante se sigue cobrando cada mano sobre esas fichas (es lo que el resto de la ficha da por hecho: «recarga al caer del 5×» presupone antes que erosionan); (b) la entrada sustituye al ante y sólo se apuesta voluntariamente.
*Recomendación:* **(a)**, y que la Fase 1a **corrija el párrafo del rector** en la misma tanda: hoy está vivo y miente.

**L-3 · ¿Se autoriza la siembra de `Math.random` en `aiPlayer.js` y en `deck.js`?**
Sin ella, «las cifras se afinan por simulación» afina contra ruido (R-3b). La de `deck.js` está **pre-autorizada sin ceremonia** por `Modos_y_Asistencia_v1.0.md §7.1`; la de `aiPlayer.js` está expresamente **excluida** de esa pre-autorización.
*Opciones:* (a) autorizar las dos dentro de APU-1, que abre `aiPlayer.js` de todos modos; (b) sólo la de `deck.js` y calibrar con volumen, como hace el banco hoy; (c) ninguna.
*Recomendación:* **(a)** — es una inyección de PRNG, no un cambio de regla, y el propio rector de niveles ya la bendijo para el archivo gemelo.

**L-4 · El conflicto de las dos listas de protegidos (§I-2): ¿cuál manda?**
Las dos listas difieren en **dos** archivos: la canónica protege `gameTable.css` y no `deck.js`; `Modos_y_Asistencia §7` al revés. MOT-1 lo levantó como H-4 y nadie lo ha cerrado.
*Opciones:* (a) subir la canónica a v1.4 con **seis** archivos (los cuatro comunes + `gameTable.css` + `deck.js`) y heredar la excepción de siembra; (b) la canónica manda tal cual y `deck.js` queda desprotegido; (c) se deja abierto.
*Recomendación:* **(a)** — es la unión, no cuesta nada, y deja la excepción de §7.1 escrita donde la gente la busca.

**L-5 · ¿Quién valida el monto: el motor o la pantalla?**
Hoy la pantalla, y el motor acepta montos negativos y fraccionarios (A-10, MOT-1 D5). APU-1 abre `applyBetAction` de todos modos para el all-in. Cerrar N-4 de paso cuesta pocas líneas y le ahorra una edición a MOT-1; no cerrarlo deja el agujero abierto un ciclo más.
*Opciones:* (a) cerrarlo en APU-1; (b) dejarlo para MOT-1, que es quien lo necesita de verdad.
*Recomendación:* **(a)**, declarándolo como deuda saldada de MOT-1 y no como alcance nuevo.

**L-6 · La pantalla «Retar a las IAS»: ¿componente compartido o duplicado?**
Ver §K-3. El dato que falta para decidir no es técnico: es si las dos pantallas deben **seguir pareciéndose** cuando PvP evolucione, o si es coincidencia de hoy.
*Recomendación:* **K-3c** (compartir sólo la fila) — es la pieza que se repite cuatro veces en la pantalla nueva y la única cuya divergencia se notaría; la carcasa puede querer separarse.

**L-7 · ¿Hace falta que el jugador se entere de un retiro forzoso?**
Hoy no se lo dice nadie (H-2). Con all-in defensivo el caso cambia de nombre pero no desaparece: habrá un asiento que entra all-in sin haberlo pedido.
*Opciones:* (a) frase propia en `cronicaCore` para el all-in involuntario; (b) reutilizar la frase de retiro; (c) sólo la marca visual del asiento.
*Recomendación:* **(a)** — es texto, es barato, y `cronicaCore` está fuera de los protegidos precisamente para esto.

---

## §M — Estimación de la Fase 1

Formato de MOT-1: rango por sub-tanda. La base de la estimación son las **seis zonas de `gameEngine.js`** y las **cuatro de `aiPlayer.js`** medidas en los bloques A–C, y la lección de la casa de que las Fase 0 y 1 de este proyecto salen largas.

| Sub-tanda | Qué | Rango |
|---|---|---|
| **1a** | Documental y lista cerrada de ediciones al motor. Incluye: corregir `Modos_y_Asistencia §3.3` (§I-1a), cerrar §I-2 en `Protegidos` v1.4, y escribir la tabla de ediciones a los dos protegidos **antes** de tocar nada. Sin código. | **2 – 3 h** |
| **1b** | Motor: entrada por asiento (`createInitialState`), all-in, pozos por capas, cierre de mano con capas, y la legalidad del monto de L-5. Sin red. Con pruebas nuevas —**el bloque de dinero de hoy son 3 aserciones (G-1)**, y esto necesita del orden de 25–35. | **7 – 11 h** |
| **1c** | IA: umbrales por tamaño de mesa, farol por bloques, cuarto del pozo, regla del all-in de la IA, personalidades, ritmo humano. **Requiere 1b cerrada** (la IA tiene que saber qué es una capa). Incluye extender la trampa Proxy de R-2. | **5 – 8 h** |
| **1d** | Simulación: siembra (si L-3 la autoriza), modos nuevos del banco y **corrida de calibración**. El cómputo es barato (G-5: la matriz completa en ~2 min); el coste es diseñar qué se mide y leer los resultados. | **3 – 5 h** |
| **1e** | Pantalla «Retar a las IAS» con cuatro filas, marca de all-in en el asiento (R-6), pregunta de recarga entre manos (R-7), y las **cuatro superficies del «no cubre»** de R-5. Es la sub-tanda con más riesgo de descubrimiento tardío. | **6 – 9 h** |
| **1f** | Humo en teléfonos: las dos vías de render, las cuatro mesas, `diagSAL` sin regresión, `--bandas` verde. | **2 – 3 h** |
| | **Total** | **25 – 39 h** |

**Tres notas sobre la estimación, porque los rangos solos engañan:**

1. **1b y 1c no se pueden paralelizar** y juntas son la mitad del total. Las dos abren protegidos y la vara (`--bandas`) sólo sabe decir «algo cambió», no cuál de las dos lo cambió. **Correrla entre 1b y 1c no es opcional** si se quiere poder atribuir una regresión.
2. **1e es el rango más ancho a propósito.** R-5 y R-6 son los dos hallazgos que más trabajo pueden esconder, y ninguno de los dos es medible por lectura: el primero porque las cuatro copias del «no cubre» deciden cosas ligeramente distintas y hay que probar cada una, el segundo porque el hueco en píxeles hay que medirlo con arnés.
3. **El total se solapa con la estimación de MOT-1** en las ediciones 1, 4 y 5 de §I-3. Si las dos campañas escriben esas ediciones por separado, se escriben dos veces y divergen; si las escribe una, la otra ahorra del orden de 3 – 4 h. **Cuál de las dos las escribe es decisión de secuencia, no de esta fase.**

---

## Cierre

### Línea base al cerrar

| Vara | Al arrancar | Al cerrar | Δ |
|---|---|---|---|
| `npm run lint` | 21 | 21 | **0** |
| `npx vitest run` | 685 | 685 | **0** |
| `node scripts/diagSAL.mjs sal` | 102/102 | 102/102 | **0** |

No se volvieron a correr al cierre porque **no se modificó ni un archivo de `src/`, `supabase/`, `scripts/` o `laminas/`**: la única escritura de esta fase es este informe, y `git status` lo demuestra.

### `git status`

```
 M .gitignore
?? _probeA1.mjs
?? _shotA1.mjs
?? docs/reportes/AJILEI_APU-1_Fase0_Informe_v1.0.md   ← este informe
?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
?? laminas/mon1/_entorno.txt
?? laminas/mon1/lamina.html
?? laminas/mon1/tiempos.json
?? scripts/_cel1bFila.mjs
```

Todo salvo la línea marcada **ya estaba así al arrancar**, tal como consta en la instantánea de git del inicio de la sesión. La corrida del banco de G-5 escribió `capturas-dsk/nivB0_matriz.json`, que **no aparece** porque `.gitignore:31` ignora `capturas-dsk/*`; `diagSAL` escribió en `capturas-sal/`, ignorada por la misma vía.

### Protegidos — intactos, y contra la instantánea sellada

```sh
for f in src/engine/gameEngine.js src/engine/aiPlayer.js \
         src/config/seatLayouts.js src/styles/opponentPanel.css \
         src/styles/gameTable.css; do
  git diff --quiet f9ee503 -- "$f" && echo "INTACTO  $f" || echo "TOCADO   $f"
done
```

| Archivo | `git diff` vs `f9ee503` | blob vivo | líneas | Instantánea §3 de `Protegidos` v1.3 |
|---|---|---|---|---|
| `src/engine/gameEngine.js` | **INTACTO** | `6ddadd536eb8` | 548 | `6ddadd536eb8` · 548 — **idéntico** |
| `src/engine/aiPlayer.js` | **INTACTO** | `0860812af936` | 908 | `0860812af936` · 908 — **idéntico** |
| `src/config/seatLayouts.js` | **INTACTO** | `0d1bb8ea66a8` | 59 | `0d1bb8ea66a8` · 59 — **idéntico** |
| `src/styles/opponentPanel.css` | **INTACTO** | `3ce6383eec0d` | 1084 | `3ce6383eec0d` · 1084 — **idéntico** |
| `src/styles/gameTable.css` | **INTACTO** | `1e21371c8543` | 6289 | `1e21371c8543` · 6289 — **idéntico** |

Los cinco coinciden **al blob** con la instantánea sellada el 2026-08-20 y refrescada el 2026-08-26. No se abrió ninguno; se leyeron los cinco.

### Tiempo empleado

| Tramo | Tiempo |
|---|---|
| Línea base (lint, vitest, `diagSAL` contra servidor propio) | ~15 min (en paralelo con la lectura) |
| Bloque A — el dinero en el motor | ~20 min |
| Bloque B — fases, rondas, turnos | ~10 min |
| Bloque C — la IA (908 líneas de `aiPlayer.js`) | ~25 min |
| Bloque D — bancarrota y salida | ~10 min |
| Bloque E — saldo y selección | ~20 min |
| Bloque F — la mesa en pantalla | ~15 min |
| Bloque G — pruebas, arnés, simulación (incluida la corrida medida) | ~15 min |
| Bloque H — sonido y textos | ~5 min |
| Bloque I — contradicciones y herencia de MOT-1 | ~15 min |
| §J – §M y redacción | ~30 min |
| **Total** | **~3 h**, dentro del tope de la ficha |

**Ningún bloque queda pendiente.** Las tres preguntas que la ficha admitía dejar sin cerrar por lectura se resolvieron así: F-3 (píxeles del hueco) queda **declarada como «medir con arnés»** con el modo ya identificado; G-5 se **midió en vivo** en vez de estimarse; y A-10 se **cita de MOT-1** en vez de repetir la sonda, como manda la regla de esta fase.

**STOP.** Sin commits.
