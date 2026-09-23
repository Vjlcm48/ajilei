# AJILEI · APU-1 · Fase 1c — Informe de cierre (STOP-2) · v1.0

**Campaña:** APU-1 — Apuestas, pilas y agresividad de las IAS
**Fase:** 1c — la IA: monto, subida fuerte, cuarto del pozo, all-in, farol por bloques, siembra
**Ficha:** `AJILEI_APU-1_Fase1c_v1.0.md` · **Ejecutor:** Claude Code · **Rector:** Claude (chat) · **Decisor:** Victor
**Base:** `main` en `f9ee503` + 1a (docs) + 1b (motor), sin commitear
**Fecha:** 2026-09-17 · **Sin commits.**

---

## §A · Línea base y blobs

| Vara | Antes de 1c | Al cierre |
|---|---|---|
| `npx vitest run` | 745 en 29 archivos | **779 en 30**, 0 fallos (10 corridas seguidas) |
| `npm run lint` | 21 (20 errores + 1 aviso) | **21** · Δ = 0 |
| `npm run build` | verde | **verde** (397 ms) |

### Blobs de los seis protegidos

| Archivo | Sellado (1b) | Al cerrar 1c | |
|---|---|---|---|
| `src/engine/aiPlayer.js` | `0860812af936` | `5838277325b3` | abierto (A-1…A-9) |
| `src/engine/gameEngine.js` | `8b29b6443be6` | `110648bd01b9` | abierto (E-12) |
| `src/engine/deck.js` | `bfb44c03786c` | `bfb44c03786c` | **INTACTO** |
| `src/config/seatLayouts.js` | `0d1bb8ea66a8` | `0d1bb8ea66a8` | **INTACTO** |
| `src/styles/opponentPanel.css` | `3ce6383eec0d` | `3ce6383eec0d` | **INTACTO** |
| `src/styles/gameTable.css` | `1e21371c8543` | `1e21371c8543` | **INTACTO** |

---

## §B · Lo escrito, por archivo

### `src/engine/aiPlayer.js` (+432 −51; de ellas +30 −6 son la siembra de 1c-i)

| Ed. | Rango | Qué |
|---|---|---|
| **A-0** | `:1-8` | Dos imports nuevos: `pozos.js` (`accionesDe`, `esLegal`, `costoDe`) y `ajileiConfig.js`. **Salida de rango consignada** (D-1). |
| **A-9** | `:466-486` y los seis sitios de azar | `rng` / `setRng` / `resetRng`, ligados tarde (1c-i). |
| **—** | `:47-110` | Lectores de configuración por reto: `retoDe`, `subidaFuerteActiva`, `umbralSubidaFuerte`, `desplazamientoDe`, `fraccionPozoDe`, `puntajeAllInDe`, `bloqueFarolDe`, `probPasarConManoGrandeDe`. |
| **A-6/A-8** | `:520-600` | Estado de módulo `_farol` y `_trampa`, `_olvidarPlanes()` y `_planFarol()`. Limpieza en `_resetForTesting` y en las dos señales de partida nueva de `_ensurePersonalities`. |
| **A-1** | `:869-1000` | Contrato `{ action, k, peso }` y el paso 0 completo: `enTurno`, `acciones`, `arbitra`, `puede`, `mayorK`, `pesoDe`, `ESCALERA` y `fin()`. |
| **A-2** | `:900`, `:1000`, `:1128` | Mueren las cuatro guardas de saldo. `canAffordRaise` = `puede('subir')`. |
| **§6.2** | `:1035-1046` | El Ajilei sube con el mayor `k` legal, tras el mismo interruptor que A-3. |
| **A-4** | `:1104-1118` | Muere la matemática de bote de ④ (`boteDecide`, `porIgualar`, `pagaElBote`). `eqMano` **sobrevive**: la usa `scoreEf`. |
| **A-3…A-8** | `:1145-1240` | La fila de decisión de §3.2, pasos 2 a 7. |
| **—** | `:1243-1285` | Las colas de `BET_1/2/3` pasan por `fin()`; se retiran las líneas de `boteDecide`. |

### `src/engine/gameEngine.js` — sólo E-12

`decidirIA(state, seat)` nueva junto a `applyAIBetAction`, que queda en tres líneas y **sin puente**. El `import` de `pozos.js` pierde `accionesDe` (sólo lo usaba el puente). Nada más del archivo cambió.

### No protegidos

| Archivo | Δ | Qué |
|---|---|---|
| `src/config/ajileiConfig.js` | +64 −5 | Las siete claves de `ia` por reto (2.2), con Básico neutro. |
| `src/engine/pozos.js` | +36 | Motivo **`sin_rival`** (undécimo) y `hayRival()`. |
| `scripts/bancoNiveles.mjs` | +97 −19 | `--seed N` (mulberry32 a mazo e IA), `SIN COMPARAR` con código 2, y el conductor espejo transportando `k`. |

---

## §C · Pruebas

**779 = 745 (1b) + 4 (1c-i) + 29 (`testIAAPU1`) + 1 (trampa Proxy extendida).** Ninguna borrada.

### Nuevo: `scripts/testIAAPU1.test.js` — 29 pruebas

| Bloque | Pruebas | Qué sella |
|---|---|---|
| 1 · Legalidad (regla 1.4) | 2 | 500 mesas aleatorias con semilla fija × tres retos: la acción está en `accionesDe`, **el monto también es legal**, `k` ∈ multiplicadores, `peso` ∈ los tres. Se afirma que más de 1.000 de las 1.500 filas no salen vacías, para que la batería no mida el vacío. |
| 2 · A-3 subida fuerte | 6 | El filo exacto del umbral (mesa 2, par 41/40), el mayor `k` que la pila cubre y no el de la tabla, `BET_1` reactiva, Básico neutro, el desplazamiento del temperamento. |
| 3 · A-4 cuarto del pozo | 3 | Barato paga con la mano más floja; caro decide el listón; Básico ignora la regla. |
| 4 · A-5 all-in | 6 | La fila es `['allIn','retirarse']`; pila barata → empuja; pila cara y mano floja → se va; mano fuerte → empuja; CONSERVADORA cambia el veredicto en el filo; Básico empuja por fracción pero no mira la mano. |
| 5 · A-6 farol | 6 | El sorteo cae en la mano esperada; farolea la de mayor pila y sólo ella; repite en `BET_3`; el plan muere ante una subida que no cubre y entra A-5; Básico nunca; un solo farol por bloque. |
| 6 · A-8 trampa | 3 | Dado bajo → iguala en `BET_2` y cobra en `BET_3`; dado alto → sube ya; Básico nunca. |
| 7 · E-12 | 3 | `decidirIA` no muta; `applyAIBetAction` aplica exactamente su `{action, k}`; el `peso` no entra al motor. |

### §3.6 · Trampa Proxy extendida (`testNivel2 §8`)

Una prueba nueva recorre las **cuatro situaciones que 1c abre** —all-in ajeno en la mesa, la mano de farol, `BET_3` con la trampa armada y la ronda donde sólo cabe empujar la pila— en **los tres retos**, y exige que no se lea ni una carta ajena ni el contenido del taco. Lleva comprobaciones de que la situación es la que dice (si el farol no se dispara, la prueba falla), para que una trampa sobre una rama muerta no pase por vigilancia.

### Cambios de veredicto (7) y de conductor (4)

| Dónde | Antes → ahora | Por qué |
|---|---|---|
| `testNivel1 §1` (oro de Básico) | identidad exacta → identidad **salvo dos puertas contadas** | Ver D-2. Se afirma que cada puerta se dispara y que ≥ 70 % de la batería sigue comparándose decisión contra decisión. |
| `testNivel2 §1` (oro doble) | identidad exacta → Básico igual, **Avanzado sólo donde APU-1 manda** | Cada divergencia de Avanzado tiene que encajar en una de seis puertas comprobadas contra la regla; si no, falla. |
| `testNivel1 §5` ×2 (③ comodín) | `subir`/`igualar` → `subir`/`subir` | A-3 puso el listón de subida por debajo del gemelo entero (D-5). |
| `testNivel1 §6` (④, «odds en contra») | `retirarse` → `igualar` | §6.5 retira la equidad como criterio de pago: decide el temperamento, igual que Básico. |
| `testNivel1 §6` (④, «gratis») | `igualar` → **`pasar`** | Sin apuesta viva, `igualar` es ilegal (`sin_apuesta`); hasta 1b lo tapaba el puente. Misma conducta, nombre legal. |
| `testNivel1 §8` (D-5, contraste) | lee `pot` **y** `contrib` ajenos → lee `pot`, **ya no** `contrib` ajenos | Frontera más estrecha: la IA de APU-1 lee menos información pública que la de NIV-1. |
| `testEngine §7` (all-in de la IA) | el mock decidía `pasar` | Sin puente, un mock que dice `pasar` donde pasar es ilegal no avanza. El mock pasa a ser ajustable; la elección del all-in la mide `testIAAPU1` con la IA real. |
| 4 conductores de prueba | `igualar` → `allIn` cuando no cubre | `testAI.simBettingPhase`, `testNivel1 §6`, y los dos que ya lo tenían. Sin esto, las rondas no convergen (D-6). |

---

## §D · Hallazgos

**D-1 · Dos líneas de import fuera de rango (consignado, no parado).** `aiPlayer.js` tuvo que importar `pozos.js` y `ajileiConfig.js`. A-2 («la legalidad la da `acciones`») y §2.2 («las cifras son parámetro por reto») no son implementables sin ellas. Mismo criterio que D-9 de 1b: se consigna y se sigue.

**D-2 · El oro de Básico no podía quedar intacto, y la razón no es estrategia sino reglas.** La batería del oro contiene estados donde:

1. La respuesta anterior **ya no es legal** — Ajilei en mano con la pila por debajo de la apertura: la lógica de NIV-1 devolvía `apostar` sin mirar el saldo y el retiro forzoso del motor lo tapaba. Ese retiro murió en 1b.
2. **La pila no cubre el pago.** Antes se perdía lo apostado; desde §4.1 existe el all-in. La lógica transcrita **no tiene opinión** sobre el all-in porque el all-in no existía cuando se transcribió.

El oro quedó exigiendo identidad exacta fuera de esas dos puertas, contándolas y afirmando que ambas se disparan. **Es el punto que más conviene que el rector revise**: es la única vara que la ficha declaraba intocable y ha habido que tocarla.

**D-3 · A-5 gobierna también a Básico, y no es una excepción caprichosa.** La ficha lo pedía (`fraccionPozo ?? ¼`) y se implementó literal. Si se hubiera dejado neutro del todo, Básico —la mesa por defecto— nunca iría all-in y la prueba central de 1b (`testEngine §7`) se caía: la mesa volvería a la regla vieja de perder lo apostado. Lo que sigue apagado en Básico es `puntajeMin`, o sea la parte que exige leer la mano.

**D-4 · El farol literal habría nacido muerto.** §6.4 dice «en `BET_2` sube». `BET_2` empieza SIEMPRE con la apuesta en cero —el motor resetea `currentBet` al cambiar de ronda—, así que `subir` es ilegal ahí y el plan habría caído en `pasar` en casi todas las manos elegidas. Se implementó como «poner dinero delante»: `subir` si hay apuesta viva, `apostar` si no.

**D-5 · ③ (el comodín) queda VIVA en el puntaje y TAPADA en la acción.** El umbral de §6.3 (36 en mesa 4, 33 en mesa 5) está por debajo del `raiseMin` de los cuatro temperamentos (40…44 con el `+2` por rival), así que las dos mitades del gemelo 47-con/47-sin suben las dos. El normativo §6.3 ya dejaba abierta esa relación —«la simulación decide la relación entre ambos»—: **es materia de 1d**, y hasta entonces una capacidad medida y calibrada está sin efecto sobre ninguna decisión.

**D-6 · La clase «ronda sin converger» sigue cobrando.** Retirado el puente, cualquier conductor que mande una acción ilegal deja la ronda dando vueltas. 1b arregló tres; 1c destapó otros dos (`testAI` y `testNivel1 §6`) porque ahora la IA sube ×5 y ×10 y el conductor humano deja de cubrir. **Todo conductor nuevo tiene que consultar `accionesDe` o caer al all-in.**

**D-7 · Intermitencia latente desde 1b, cazada aquí.** `testHandRules` TB-1 fallaba una de cada cinco corridas: desde que `primerTurno`/`nextActiveIndex` saltan a los asientos sin fichas, al asiento de la prueba **no le llega el turno jamás**, su retiro por mock no se ejecutaba, y llegaba al showdown vivo y elegible ganando el pozo de los antes. Corregido en la prueba. **Lo que destapa y no se arregla aquí:** el ante puede dejar una pila en cero sin marcar `allIn`, y ese asiento entra en las capas como si pudiera cubrir lo que se aposte después. La cura vive en `startHand`, fuera de los rangos de 1c.

**D-8 · El espejo del banco dejó de ser simétrico, y se puede medir.** La elección de la faroleadora excluye al humano por `isHuman`, que viaja en el objeto del jugador; bajo el estado espejo el asiento conducido lleva el `isHuman` del humano real y **nunca sale elegido**, así que el duelo mide un asiento 0 sin farol. Medido en el espejo simétrico de mesa 2 (que por construcción debe dar 50 %): **48,16 % en Avanzado** (5,03σ) y **46,56 % en Pro** (10,02σ), con sesgos pareados de −3,67 pp y −6,88 pp. El tamaño sigue al del bloque —Pro farolea cada 8 manos y Avanzado cada 12—, que es la firma que confirma la causa. No se toca el espejo: `isHuman` también lo usa la lectura de descartes de ② y cambiarlo movería medidas selladas. **Decisión del rector para 1d:** o el espejo aprende a presentar el asiento conducido como IA (y ② se adapta), o la elección deja de mirar `isHuman`.

**D-9 · Las partidas duran mucho menos.** Con la subida fuerte y el all-in, una mesa de cinco se liquida en ~3 manos (el banco cuenta 4.403 partidas en 20.000 manos de mesa 5 Pro, contra 551 en Básico). Dos pruebas de integración pedían un mínimo de manos por partida y ahora abren partida nueva cuando una se acaba.

**D-10 · `pagaElBote` y `porIgualar` se retiraron; `eqMano` no.** La ficha pedía retirarlos «si nadie más los usa». `eqMano` sí se usa: `scoreEf` la consume para ③ y ②. `_DIAG_PRO` no los exponía.

---

## §E · Banco

### Convergencia (vara 3) — `--manos 20000 --seed 11`, 12 celdas × tres retos

| Reto | Celdas | «sin converger» | Conservación de fichas |
|---|---|---|---|
| `basico` | 12 | **0** | VERDE |
| `avanzado` | 12 | **0** | VERDE |
| `pro` | 12 | **0** | VERDE |

Las 36 celdas convergen y ninguna repite estado. La puerta (b) del propio banco —espejo simétrico ≈ 1/N— sale **ROJA en Avanzado y Pro** por D-8, no por la IA.

### Bandas (vara 4) — las dos corridas reales de D-16

| Corrida | Celdas comparadas | Familia / umbral | Veredicto | Peor |
|---|---|---|---|---|
| `--nivel avanzado --duelo basico` | 16 | 48 · 4,03σ | **ROJA 15/16** | `mesa5\|avanzado\|aleatorio` fichas/mano −2,7185 → −12,4986 (**−152,29σ**) |
| `--nivel pro --duelo avanzado,basico` | 20 | 64 · 4,10σ | **ROJA 19/20** | `mesa5\|pro\|aleatorio` fichas/mano −1,0930 → −9,2129 (**−157,45σ**) |

**Es el rojo que la ficha anunciaba: la conducta cambió por diseño.** El patrón es uniforme y tiene un nombre — *la mesa cobra mucho más caro jugar mal*:

| Celda | fichas/mano del asiento 0, sellado → nuevo |
|---|---|
| `mesa4\|avanzado\|pasivo` | −0,66 → **−8,24** |
| `mesa5\|avanzado\|pasivo` | −0,83 → **−17,16** |
| `mesa4\|avanzado\|aleatorio` | −2,63 → **−7,57** |

La fuga que NIV-B0 midió —un conductor pasivo que gana pozos por abandono— sigue ganando *manos* (+0,48 pp en mesa 4) pero ahora **paga por ellas**: pierde entre 12 y 20 veces más fichas por mano. Es exactamente lo que el propio banco declara en su nota `porQueFichas`: las manos ganadas premian no retirarse, las fichas no tienen lado barato.

**No se re-sella nada.** La vara de NIV-CAL sigue siendo la de NIV-CAL hasta que 1d encienda Básico y calibre los umbrales; re-sellarla ahora congelaría cifras de TRABAJO como si fueran resultados.

### Arneses

| Arnés | Resultado |
|---|---|
| `npm run build` | verde, 397 ms |
| `diagDSK.mjs o1` (5173) | **16/16** |
| `diagDSK.mjs msg` (5173) | **16/16 OK**, 0 fallas |
| `diagSAL.mjs sal` | **102/102** |

Servidor de desarrollo cerrado al terminar; 5173 libre.

---

## §F · Cierre

| Vara de §3.7 | Estado |
|---|---|
| 1 · lint 21 | ✅ 21, Δ = 0 |
| 2 · vitest 0 fallos, oro intacto, Proxy extendida | ⚠️ 779/779 y Proxy extendida verde, pero **el oro de Básico llevó dos puertas** (D-2) |
| 3 · convergencia en los tres retos | ✅ 36 celdas, 0 «sin converger» |
| 4 · bandas, las dos corridas, rojo esperado | ✅ ROJA 15/16 y 19/20, reportadas celda a celda, sin re-sellar |
| 5 · build, `o1`, `msg`, `diagSAL` | ✅ los cuatro |
| 6 · protegidos | ✅ cuatro intactos al blob; `deck.js` también |

**Lo que 1c NO hizo** (§3.8): no enciende Básico, no re-sella bandas ni el oro, no toca pantalla ni ritmo ni textos ni hooks, no enruta fases (§4.3 → 1e), no commitea.

**Para 1d, por orden de urgencia:** D-2 (la puerta del oro), D-5 (la relación entre el umbral de §6.3 y el `raiseMin` de los temperamentos, que hoy anula ③), D-8 (el espejo del banco), D-7 (el ante que deja pila en cero sin marcar all-in) y D-9 (la duración de las partidas, que cambia el significado de toda métrica «por partida»).
