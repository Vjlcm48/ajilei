# AJILEI · VOZ-3 · La voz del All-in · Fase 0 · Informe v1.0

**Para:** el rector y Victor · **De:** Claude Code · **Fecha:** 2026-10-23
**Ficha:** `AJILEI_VOZ-3_Fase0_v1.0.md` · **Base:** `main` en `5fad6d9` (TAB-2)
**Tipo:** diagnóstico, solo lectura. Única escritura en el repo: este informe. Sin commits.

---

## Resumen para Victor

1. **El defecto está confirmado y es más ancho que la frase.** El motor elige bien al ganador (la mejor mano) y escribe bien su mensaje, pero acto seguido sobrescribe `winner` con el dueño de la capa **de arriba** (`gameEngine.js:285` y `:292`). Cuando esa capa es el sobrante, su dueño (la IA que recupera su vuelto) pasa a ser «el ganador» para **todo** lo que se pinta: la frase, el color, la mano que se enseña en grande, las cartas resaltadas, el pulso dorado, hacia dónde vuelan las monedas, el saldo retenido durante el vuelo y el contador «Manos ganadas». Solo el récord del servidor (ECO-1) acierta, porque ya mira la principal.
2. **El espejo (D4) existe y es más frecuente que el caso reportado.** En un barrido con la IA de verdad en los asientos 1–4 (y el humano jugando al azar), de cada 100 pozos partidos en la mesa de 2, **74** acaban con el tono del óvalo contrario a lo que pasó con tus fichas; casi todos son el espejo: la IA va all-in corta, te gana, y el óvalo te dice «¡Ganas con…!» con tu mano peor.
3. **No hace falta abrir el motor (D2: sí basta).** Todo lo necesario está en el estado al pagar. Lo demostré reconstruyendo, solo desde la capa de la voz, lo que cobró cada asiento: cuadra con el motor en 61 de 61 casos construidos y en 3.284 de 3.284 pozos partidos de un barrido con semilla (manos reales del motor; la IA juega con su política de verdad y el humano al azar).
4. **La regla del rector se confirma en lo principal y se corrige en tres puntos.** El titular sale de la capa principal (es siempre la mejor mano, y su dueño siempre gana fichas: D8 se cumple en el 100 % del barrido). Pero: (a) una capa de un solo elegible **no siempre es solo vuelto**: a veces lleva fichas de quien se retiró, y esas sí se ganan; (b) la capa «sin elegibles» existe en el juego y devuelve a **varios** asientos a la vez, el humano incluido; (c) puedes ganar fichas sin ganar la principal (ganas una capa intermedia), y ahí hace falta decidir el tono (pregunta P-2).
5. **El óvalo no se mueve.** Medí las frases nuevas en el óvalo real, en 6 tamaños × 4 mesas: el óvalo y la caja de la frase se mueven 0 px en todas. El recorte con «…» y el globo de VOZ-2 funcionan sin cambios con la frase más larga (321 caracteres). El titular entra entero en las dos líneas visibles en la mesa de 2 y la de 3, en los horizontales grandes y en la tableta. En la mesa de 4 y la de 5 en vertical el titular ya se corta hoy (la caja de la frase mide 73–95 px y caben 16–26 caracteres), y VOZ-3 no lo empeora: el titular usa las mismas plantillas.
6. **Base intacta:** vitest 71/1.680 verde a la primera, lint en su línea base de 20 errores, build verde, `tab` verde (9 de 9 varas). Los seis protegidos, idénticos al empezar y al terminar.

---

## 1. Línea base y huellas

| Prueba | Resultado |
|---|---|
| `vitest run scripts/ src/` | **71 archivos, 1.680 pruebas, todo verde, a la primera** (7,4 s). No apareció el falso «71 failed, no tests» de TAB-2: nada que anotar para ARN-4 (T3). |
| `eslint .` | 21 problemas: **20 errores + 1 aviso**, la línea base conocida (CEL). |
| `vite build` | Verde (lo compiló el propio `diagDSK tab` al arrancar). Solo el aviso de siempre de un trozo mayor de 500 kB. |
| `diagDSK tab` (4173, sin `--ref`) | **VERDE, código 0, 1.040 s, aislamiento verde** (306 contextos, 0 escapadas). V-cel: 25/25 pares (16 idénticos al píxel) frente a escala=1 y t3 88/88 byte a byte · V-fuera 12/12 y entrar/salir 3/3 · V-h 24/24 · V-tv 48/48 · V-vuelo: cartas y monedas ≤ 0,02 px, globo ≤ 0,02 · V-giro 2/2 · V-borde 40/40 · V-hb 48/48 · V-frontera 16/16. Sin `--ref`, V-fuera solo mira la huella (no hay un `main` antiguo con el que comparar al píxel) |

**Huellas de los protegidos** (lista canónica v1.8, `docs/AJILEI_Protegidos_v1.0.md` §2). Medidas al empezar (18:30) y al terminar (18:58; sha256 entero, blob y líneas, comparados con `diff`):

| Archivo | sha256 (16) | blob | líneas | ¿igual al terminar? |
|---|---|---|---|---|
| `src/engine/gameEngine.js` | `317452ec5b57408a` | `21c4d3f56318` | 748 | sí, al byte |
| `src/engine/aiPlayer.js` | `3a8ea7b0386c7ddf` | `8cfc3736cba2` | 1.445 | sí, al byte |
| `src/engine/deck.js` | `69f92d6b9aac433c` | `eb61426083ca` | 69 | sí, al byte |
| `src/config/seatLayouts.js` | `0049051fd4b8b891` | `0d1bb8ea66a8` | 59 | sí, al byte |
| `src/styles/opponentPanel.css` | `4b91338a205e4a6a` | `fbc9f3d08ede` | 1.084 | sí, al byte |
| `src/styles/gameTable.css` | `9b6b716f23ade19a` | `87c9cb519bdb` | 6.289 | sí, al byte |

Las seis coinciden con la instantánea de la §3 de Protegidos (v1.8); `gameTable.css` da la referencia de la ficha (`9b6b716f…`, 6.289 líneas).

---

## 2. §A · De dónde nace el «ganador»

### A.1 · El motor

`doShowdown` (`gameEngine.js:210-295`) hace dos cosas distintas con la palabra «ganador»:

1. **Elige la mejor mano** entre los que no se retiraron, con el desempate por cercanía a la Mano (`:226-235`). Con ese `winner` escribe `message` (`:244-271`). Ese mensaje es correcto, pero es letra muerta: desde MSG-U1 nadie pinta `game.message` en el resultado.
2. **Reparte por capas** (`:276-279`): `ganadoresPorCapa` y `repartirCapas` de `pozos.js`. Y después **sobrescribe** `winner`:
   - `:285` — `const winnerCapa = [...ganadores].reverse().find(g => g >= 0)`
   - `:292` — `winner: winnerCapa ?? winner`

**Hipótesis del rector: confirmada, con un matiz.** `winner` es el ganador de la **capa de arriba** (la última de `capasDe`), no «el del último pedazo repartido». Si la capa de arriba no tiene elegibles (`-1`), baja a la siguiente. Cuando la capa de arriba es el sobrante, su único elegible es su dueño y se convierte en `winner`. El propio normativo lo dice a medias: `AJILEI_APU-1_Reglas_v1.3.md:158` escribe «`winner` es el ganador de la capa superior; **la celebración y el resultado reciben ganadores por capa**». La segunda mitad no se implementó nunca: los dos reciben solo `winner`.

La ruta de los retiros (`resolveWinner`, `:198-207`, llamada desde `:482-488`) deja `winner` = el último en pie. Ahí no hay defecto de titular. Pero el comentario de `:195-197` («si hay algún all-in vivo… esta ruta no se toma») **no es exacto**: el barrido encontró manos que acaban por retiros con un all-in vivo como único en pie (ver C7g y §D).

En `pozos.js` (no protegido):
- `capasDe` (`:260-296`): los niveles son las contribuciones de los all-in no retirados. La capa de arriba tiene como elegibles a los no retirados **y no all-in** (`:285-292`). Por eso el sobrante de C1 tiene un solo elegible: la IA que apostó de más.
- `ganadoresPorCapa` (`:311-327`): un ganador por capa; `-1` si no tiene elegibles.
- `repartirCapas` (`:346-364`): la capa `-1` vuelve a cada asiento por lo que puso por encima del último nivel, **también a los retirados** (`:354-356`).

### A.2 · Lo que la capa de la voz tiene a mano al pagar

En `PAYOUT` el estado conserva, por asiento: `contribMano` (lo puesto en la mano, ante incluido), `folded`, `allIn`, `score` (palo y puntos; `null` si se retiró), `cards`, `chips` ya pagados y `name`. Y por mesa: `manoIndex`, `handRules.ruleN` y `numPlayers`.

De ahí sale todo lo demás sin abrir nada:
- **Capas, importes, elegibles y ganador por capa:** `mesaCore.repartoPorCapas` (`:358-368`), que la mesa ya llama.
- **Lo que cada asiento puso en el tramo de cada capa:** `min(C_i, a_k) − min(C_i, a_(k−1))`, con la misma fórmula de `capasDe`.
- **Lo que cobró cada asiento**, separado en tres partes: lo **disputado** (capas de dos o más elegibles), lo **ganado sin disputa** (fichas de retirados dentro de una capa de un solo elegible) y lo **devuelto** (lo propio en una capa de un elegible, o en la capa sin elegibles).

Esa reconstrucción (prototipo del scratchpad, §Cierre) **cuadra al céntimo con el motor**: en 61 de 61 casos construidos y en 3.284 de 3.284 pozos partidos del barrido (manos reales del motor, semilla 7 al azar y semilla 11 con la IA real).

### A.3 · Dónde se arma la frase

| Pieza | Dónde | Qué lee |
|---|---|---|
| Titular | `GameTable.jsx:507-514` → `resultadoCore.composeResultado` (`:175-181`) → `deShowdown` (`:106-172`) o `porRetiros` (`:87-102`) | `winner: game.winner` |
| Tono del titular | `resultadoCore.js:109` (`deShowdown`) y `:88` (`porRetiros`): `winner === 0 ? 'gana' : 'pierde'` | `game.winner` |
| Clase del óvalo | `GameTable.jsx:224-228` (`claseDelMensaje`) → `claseTono` (`resultadoCore.js:50-54`): `msg-win` / `msg-lose` | el tono |
| Cola de capas (voz de APU-1) | `GameTable.jsx:1546-1547` → `mesaCore.repartoPorCapas` → `cronicaCore.componeCapas` (`:180-208`) | `game.winner` como «ganador principal» |
| Pintado | `center-zone`: `:2127` y `:2161`; `two-ovals` (mesa 2 en horizontal): `:2203` y `:2225`; globo de VOZ-2: `:2816` | `[resultado.texto, capasTexto].join(' ')` |

`componeCapas` **salta las capas del «ganador principal»** (`cronicaCore.js:195`). Como ese principal es `game.winner`, el sobrante de C1 desaparece de la cola (es «del ganador»), y la principal, que ganaste tú, sale como si fuera secundaria: «Te llevas **otros** 800 Heptacoins».

**La única frase actual de «vuelve»** es la de la capa sin elegibles: `«${monto} vuelven sin igualar.»` (`cronicaCore.js:201`), literal, sin clave. **El sobrante de un solo elegible no tiene frase hoy**: su dueño es el titular.

No hay claves de `textos.js` en toda la voz del óvalo: titular, cola y crónica son literales de `resultadoCore.js` y `cronicaCore.js` (REN-2 lo decidió así: la palabra de la moneda vive en `MONEDA`, `cronicaCore.js:27`).

### A.4 · Veredicto de D2: **sí, basta con corregir la lectura en la capa de la voz**

Pruebas:
1. **Todo dato necesario está en el estado al pagar** (A.2). No hace falta ningún campo nuevo del motor.
2. **El ganador de la principal es el `winner` original del motor.** `ganadoresPorCapa(state, score)[0]` usa el mismo conjunto (en showdown, la capa 0 tiene como elegibles a todos los no retirados) y el mismo desempate (replicado en `pozos.js:319-326` desde APU-1). En el barrido coincidió siempre con la mejor mano.
3. **Ya hay un precedente en producción:** `mesaIACore.finDeMano` (`:175-178`) lee la capa 0 y no `winner` desde ECO-1, y su comentario (`:165-166`) ya lo llama «la trampa de VOZ-3».
4. **El cobro reconstruido cuadra** (A.2).

`state.winner` puede seguir significando lo que significa hoy (la capa de arriba) para quien lo quiera. En `PAYOUT`, la capa de la voz deja de leerlo. **Ningún protegido cambia:** ni el motor, ni `gameTable.css`, ni `opponentPanel.css`. Las clases que harían falta (`msg-win`, `msg-lose`, `opp-winner`, `win-score-chip`) ya existen.

---

## 3. §B · Todos los que leen al «ganador»

Leyenda de los casos de §C: ✓ acierta hoy · ✗ falla hoy · — no aplica.

| # | Consumidor | Archivo:línea | Qué lee | C1 | C2 | C3 | C4 | C5 | C6a | C7 | C8 | C9 | C10a |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Titular de la frase | `GameTable.jsx:509` → `resultadoCore.js:175`, `:106` | `game.winner` | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| 2 | Cola «El pozo se partió…» | `GameTable.jsx:1547` → `cronicaCore.js:180-208` | `game.winner` como principal | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| 3 | Tono y clase del óvalo (`msg-win`/`msg-lose`) | `resultadoCore.js:109`, `:88` → `GameTable.jsx:224-228` | `winner === 0` | ✗ | ✓ | ✗ | ✓ | (P-2) | ✗ | ✗ | ✓ | ✓ | ✗ |
| 4 | `data-tono` (lo lee el arnés) | `GameTable.jsx:2161`, `:2225` | el tono | igual que 3 |||||||||||
| 5 | Sonido del volteo (`showdown.mp3`) | `GameTable.jsx:876-881` | si `players[winner].score` existe | ✓ (suena gane quien gane) |||||||||||
| 6 | Nivel de celebración | `celebracionCore.js:61-68` vía `useCelebracion.js:79` (`GameTable.jsx:911-920`) | `winner !== 0` → `recoleccion`; si no, `mano` o `ajilei` | ✗ | ✓ | ✗ | ✓ | (P-2) | ✗ | ✗ | ✓ | ✓ | ✗ |
| 7 | Sonido y fanfarria de la celebración | `celebracionCore.js:79-104` (`banderasDe`, `sonidoDe`) | el nivel | ✗ sin pulso dorado | ✓ | ✗ pulso al que perdió | ✓ | (P-2) | ✗ | ✗ | ✓ | ✓ | ✗ sin «¡AJILEI!» ni rasgueo |
| 8 | Hacia dónde vuelan las monedas | `GameTable.jsx:614-646` (destino `:617`, `data-coin-target`) | `game.winner` | ✗ a la IA | ✓ | ✗ a ti | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| 9 | Saldo retenido durante el vuelo | `GameTable.jsx:979-989` | resta **el pozo entero** al `winner` | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| 10 | Mano en grande, cartas resaltadas, chip de puntos, `opp-winner` | `GameTable.jsx:1552-1555` (`showdownWinnerSeat`) → `:1563`, `:1579`, `:1708`, `:1730-1737`, `:1844`, `:1889`, `:1904`, `:2023`, `:2032`, `:2420`; `OpponentPanel.jsx:56`, `:94` | `game.winner` | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| 11 | «Manos ganadas» de la tarjeta de sesión y sus puntos | `useSesion.js:27` → `sesionCore.js:26-31` → `Celebracion.jsx:303`, `GameTable.jsx:2306` | `winner === 0` | ✗ no cuenta | ✓ | ✗ cuenta | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| 12 | Récord de manos del servidor (ECO-1) | `GameTable.jsx:499` → `mesaIACore.finDeMano` (`:175-178`) → `p_fin_gano` | **capa 0** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 13 | Fin de partida (texto y «partida») | `resultadoCore.js:68-80`; `celebracionCore.js:63` | `winner` de `startHand` (`gameEngine.js:523-533`), no el de la mano | — (no se ve afectado) |||||||||||
| 14 | Crónica de apuestas | `cronicaCore.componeAccion` | no lee `winner` | — |||||||||||

Notas:
- **Ningún consumidor está en un protegido.** El motor solo produce el valor; sus cadenas de resultado (`gameEngine.js:244-271`) no se pintan.
- **Fila 9, con detalle.** Durante el vuelo la pila del `winner` se pinta como `chips − pozo` (`:989`). En C1 (mesa 2) la pila de la IA baja a 2.200 cuando en la mesa tenía 3.000, y después salta a 3.700; tu +800 aparece sin monedas que lo traigan. Aunque el destino fuera el bueno, **restar el pozo entero está mal en cuanto cobran dos asientos** (C5, C7, C10c): hay que restar lo que cobró ese asiento.
- **Fila 6, C10a.** Un AJILEI tuyo en all-in corto que gana la principal sale hoy como `recoleccion`: ni la palabra «¡AJILEI!», ni el rasgueo, ni el pulso, y la frase dice «La IA gana con Bastos, 21 pts.».
- **Fila 1, C6a.** El desempate se dice con el titular equivocado y, además, con la razón equivocada: «Gana la IA por ser el más cercano a la Mano» cuando la Mano eras tú y el desempate te lo dio a ti.
- **Arnés y pruebas:** ver §G.

---

## 4. §C · La matriz de casos

**Cómo se reprodujo.** Por funciones puras, sin pantalla: un estado a mitad de `BET_3` construido a mano con manos de fuerza fija (Copas 41 > Espadas 31 = Oros 31 > Bastos 21 > Bastos 16 > Espadas 13, sin el 7 de Oros), y **la última acción aplicada con el motor real** (`applyBetAction`), que lleva solo a `doShowdown` (o a `resolveWinner`). Después, la capa de la voz real (`composeResultado`, `componeCapas`, `repartoPorCapas`, `decideCelebracion`, `anotarMano`, `finDeMano`). Ante de 100 en todos los asientos; los asientos que no juegan se retiran tras el ante. Cada caso se corrió en las mesas 2, 3, 4 y 5 donde aplica (61 casos). En las mesas 3 a 5 solo cambia la principal: crece 100 por cada asiento retirado.

«Cobro» = fichas que entraron a cada asiento al pagar. «Neto» = cobro − lo que puso en la mano. «Propuesta» = lo que diría la regla de §D (prototipo) con las decisiones de §1.

| # | Mesa | Cobro (Tú, IA 1, IA 2…) | Capas (importe · elegibles → ganador) | Hoy: frase · tono · celebración · monedas | Propuesta (tono) | Hoy |
|---|---|---|---|---|---|---|
| **C1** humano all-in corto gana | 2 | 800 · 700 | 800 · {Tú, IA} → Tú · 700 · {IA} → IA | «La IA gana con Bastos, 21 pts. El pozo se partió: Te llevas otros 800 Heptacoins.» · `pierde` · `recoleccion` · a la IA | «¡Ganas con Copas, 41 pts! A la IA se le devuelven 700 Heptacoins.» (`gana`) | **✗** |
| | 4 | 1.000 · 700 · 0 · 0 | 1.000 · {Tú, IA 1} → Tú · 700 · {IA 1} → IA 1 | «IA 1 gana con Bastos, 21 pts. El pozo se partió: Te llevas otros 1000 Heptacoins.» · igual | «¡Ganas con Copas, 41 pts! A IA 1 se le devuelven 700 Heptacoins.» | **✗** |
| **C2** humano all-in corto pierde | 2 | 0 · 1.500 | 800 → IA · 700 → IA | «La IA gana con Copas, 41 pts.» · `pierde` · `recoleccion` · a la IA | igual, + «A la IA se le devuelven 700 Heptacoins.» si no se omite (P-4) | ✓ |
| **C3** espejo: IA all-in corta gana | 2 | 700 · 800 | 800 · {Tú, IA} → IA · 700 · {Tú} → Tú | «¡Ganas con Bastos, 21 pts! El pozo se partió: IA se lleva 800.» · `gana` · `mano` (pulso dorado) · a ti | «La IA gana con Copas, 41 pts. Se te devuelven 700 Heptacoins.» (`pierde`) | **✗** |
| | 4 | 700 · 1.000 · 0 · 0 | 1.000 → IA 1 · 700 · {Tú} → Tú | «¡Ganas con Bastos, 21 pts! El pozo se partió: IA 1 se lleva 1000.» · igual | «IA 1 gana con Copas, 41 pts. Se te devuelven 700 Heptacoins.» | **✗** |
| **C4** IA all-in corta pierde | 2, 4 | 1.500 · 0 (m2) | 800 → Tú · 700 → Tú | «¡Ganas con Copas, 41 pts!» · `gana` · `mano` · a ti | igual, + «Se te devuelven 700…» si no se omite (P-4) | ✓ |
| **C5** el humano gana una capa intermedia | 4 | 900 · 400 · 400 · 800 | 800 · {Tú, IA 1, 2, 3} → IA 3 · 900 · {Tú, IA 1, 2} → Tú · 400 · {IA 1, 2} → IA 2 · 400 · {IA 1} → IA 1 | «IA 1 gana con Bastos, 16 pts. El pozo se partió: IA 3 se lleva 800. Te llevas otros 900 Heptacoins. IA 2 se lleva 400.» · `pierde` · `recoleccion` · a IA 1 (la peor mano) | «IA 3 gana con Copas, 41 pts. El pozo se partió: Te llevas otros 900 Heptacoins. IA 2 se lleva 400. A IA 1 se le devuelven 400 Heptacoins.» (tono: P-2; tu neto es +400) | **✗** |
| | 5 | 900 · 400 · 400 · 900 · 0 | igual, la principal 900 | igual | igual | **✗** |
| **C6a** empate en la principal, el humano es la Mano | 2 | 800 · 700 | 800 → Tú (desempate) · 700 → IA | «Empate, 31 pts. Gana la IA por ser el más cercano a la Mano. El pozo se partió: Te llevas otros 800 Heptacoins.» · `pierde` | «Empate, 31 pts. Ganas por ser la Mano. A la IA se le devuelven 700 Heptacoins.» (`gana`) | **✗** |
| **C6b** el mismo empate, la IA es la Mano | 2, 4 | 0 · 1.500 (m2) | todo → IA | «Empate, 31 pts. Gana la IA por ser la Mano.» · `pierde` | igual (+ devolución, P-4) | ✓ |
| **C7** capa sin rivales: el que puso más se queda solo en la de arriba | 2–5 | es C1: los demás se retiraron tras el ante | el sobrante tiene un solo elegible | igual que C1 | igual que C1 | **✗** |
| C7′ la de arriba, disputada por dos IAS | 4 | 1.300 · 1.400 · 0 · 0 | 1.300 · {Tú, IA 1, IA 2} → Tú · 1.400 · {IA 1, IA 2} → IA 1 | «IA 1 gana con Bastos, 21 pts. El pozo se partió: Te llevas otros 1300 Heptacoins.» · `pierde` | «¡Ganas con Copas, 41 pts! El pozo se partió: IA 1 se lleva 1400.» (`gana`) | **✗** |
| C7f ruta de los retiros, sin all-in | 2, 4 | todo al último en pie | una capa | «Te retiras. La IA gana el pozo.» / «Los demás se retiran. Gana IA 1.» | igual | ✓ |
| C7g ruta de los retiros CON un all-in en pie y capa sin elegibles (del barrido, mesa 3) | 3 | IA 2: 120 · Tú: 140 · IA 1: 140 | 120 · {IA 2} → IA 2 · 280 · {} → −1 | «Los demás se retiran. Gana IA 2. El pozo se partió: 280 vuelven sin igualar.» | «Los demás se retiran. Gana IA 2. Se te devuelven 140 Heptacoins. A IA 1 se le devuelven 140 Heptacoins.» | ½ (la cifra es la suma de dos devoluciones) |
| **C8** humano retirado; all-in entre IAS | 4 | 0 · 700 · 1.000 · 0 | 1.000 · {IA 1, IA 2} → IA 2 · 700 · {IA 1} → IA 1 | «IA 1 gana con Bastos, 21 pts. El pozo se partió: IA 2 se lleva 1000.» · `pierde` · monedas a IA 1 | «IA 2 gana con Copas, 41 pts. A IA 1 se le devuelven 700 Heptacoins.» (`pierde`) | **✗** (el tono acierta, el titular no) |
| **C9** control sin all-in | 2–5 | todo al ganador | una capa | «¡Ganas con Copas, 41 pts!» / «IA 1 gana con Copas, 41 pts.» | **idéntico, al byte** | ✓ |
| **C10a** AJILEI tuyo en all-in corto | 2 | 800 · 700 | como C1 | «La IA gana con Bastos, 21 pts. El pozo se partió: Te llevas otros 800 Heptacoins.» · `recoleccion` (sin «¡AJILEI!») | «¡AJILEI! Ganas con mano perfecta. A la IA se le devuelven 700 Heptacoins.» (`gana`, nivel `ajilei`) | **✗** |
| C10b igualar con la última ficha (all-in sin capa extra) | 2–5 | todo al ganador | una capa | «¡Ganas con Copas, 41 pts!» | idéntico | ✓ |
| C10c principal pequeña, capa disputada grande | 4 | 3.900 · 0 · 550 · 0 | 550 · {Tú, IA 1, IA 2} → IA 2 · 3.900 · {Tú, IA 1} → Tú | «¡Ganas con Espadas, 31 pts! El pozo se partió: IA 2 se lleva 550.» · `gana` · `mano` | «IA 2 gana con Copas, 41 pts. El pozo se partió: Te llevas otros 3900 Heptacoins.» (tono: P-2; tu neto es +1.800) | discutible (P-2) |
| C10e sobrante de un all-in que **apostó** su pila entera | 4 | 800 · 0 · 300 · 0 | 800 · {Tú, IA 2} → Tú · 300 · {IA 2, en all-in} → IA 2 | «IA 2 gana con Bastos, 21 pts. El pozo se partió: Te llevas otros 800 Heptacoins.» | «¡Ganas con Copas, 41 pts! A IA 2 se le devuelven 300 Heptacoins.» | **✗** |
| C10f capa de un elegible **con fichas de un retirado** | 4 | 1.000 · 1.100 · 0 · 0 | 1.000 · {Tú, IA 1} → Tú · 1.100 · {IA 1} → IA 1 (800 suyas + 300 de IA 2, que se retiró) | «IA 1 gana con Bastos, 21 pts. El pozo se partió: Te llevas otros 1000 Heptacoins.» | «¡Ganas con Copas, 41 pts! El pozo se partió: IA 1 se lleva 300. A IA 1 se le devuelven 800 Heptacoins.» | **✗** |

El detalle completo de los 61 casos (fichas por asiento, capas, frase, tono, nivel, vuelo, retención, «Manos ganadas» y `finDeMano`) está en el scratchpad (`casos_voz3.txt`, §Cierre).

**¿Con qué frecuencia?** Barrido de manos reales del motor, 1.500 mesas por tamaño:

| Mesa | Pozos partidos (IA real) | Tono de hoy contrario al neto del humano | Tono `gana` sin ganar la principal (el espejo) | Al azar: pozos partidos / contrarios |
|---|---|---|---|---|
| 2 | 38 | **28 (74 %)** | 28 | 131 / 81 |
| 3 | 134 | 39 (29 %) | 40 | 457 / 98 |
| 4 | 246 | 43 (17 %) | 47 | 833 / 119 |
| 5 | 353 | 55 (16 %) | 58 | 1.092 / 149 |

Con la IA real el espejo domina: la IA va all-in a la defensiva cuando tú subes, y es justo ahí donde el óvalo te felicita. El barrido al azar exagera las rarezas (retirarse sin apuesta viva); el de la IA real no las produce, y por eso se dan las dos cifras.

---

## 5. §D · La regla del titular

### D.1 · La hipótesis, punto por punto

| Punto de la hipótesis | Veredicto | Prueba |
|---|---|---|
| «Una capa con un solo elegible no se gana: se devuelve» | **Se corrige.** Es verdad **solo para la parte propia** de su dueño | (a) En la ruta de los retiros, la capa 0 tiene un solo elegible y **se gana** (son las fichas de los que se retiraron). (b) Una capa de un elegible que no es la principal puede llevar **fichas de quien se retiró dentro de ese tramo** (C10f; IA real: 8, 8 y 9 de cada 1.500 mesas en 3, 4 y 5; al azar, 121, 226 y 327): esa parte no vuelve, se gana sin disputa. (c) Su dueño puede estar en all-in (C10e): sigue siendo un vuelto. |
| «El titular sale de las capas disputadas: si el humano se lleva la principal, “¡Ganas con…!”; si no, gana quien se lleva la principal» | **Confirmado para el quién** | El ganador de la capa 0 es la mejor mano entre los que llegaron al volteo (mismo conjunto y mismo desempate que el `winner` local del motor). **Su neto es siempre positivo**: gana todas las capas en las que es elegible, y en cada una los demás pusieron al menos el ante. **0 contraejemplos en 3.284 pozos partidos.** D8 se cumple. |
| (implícito) el tono sale de lo mismo | **Incompleto** | Puedes ganar fichas **sin** ganar la principal (C5: +400; C10c: +1.800). IA real: 1, 5 y 4 de cada 1.500 mesas en 3, 4 y 5; al azar, 23, 34 y 38. Con la hipótesis pura el óvalo saldría `pierde` con fichas a tu favor. Lo contrario no pasa: si ganas la principal, tu neto es positivo. → **P-2** |
| «Las demás capas disputadas de otro dueño siguen en la voz de APU-1, agrupadas por ganador» | **Confirmado**, con un añadido | Las fichas de retirados dentro de una capa de un elegible (punto 1b) entran ahí como «X se lleva N». |
| «Las devoluciones van al final, con la redacción de D6» | **Confirmado**, con dos huecos | (i) D6 no tiene forma para el humano, y el espejo la necesita: «Se te devuelven 700 Heptacoins.» → **P-3**. (ii) La capa sin elegibles devuelve a **varios** asientos a la vez, retirados incluidos (C7g) → una oración por asiento, en orden de asiento (P-3). |

### D.2 · La regla propuesta (pura, sin abrir nada)

Entrada: el estado en `PAYOUT`. Salida: `{ principal, titular, tono, nivel, otras, devoluciones, cobro }`.

1. **Capas:** `repartoPorCapas(state)`. Con una sola capa, todo como hoy (C9 y C10b quedan al byte).
2. **Principal** = el ganador de la capa 0. En la ruta de los retiros es el último en pie; en el volteo, la mejor mano.
3. **Por asiento:** devuelto = lo propio en las capas de ≤ 1 elegible (de la capa 0 en la ruta de los retiros, nada: esa se gana); ganado sin disputa = lo ajeno en una capa de un elegible que no es la 0; disputado = las capas de ≥ 2 elegibles que ganó. El cobro es la suma de los tres y **cuadra con el motor**.
4. **Titular** = `composeResultado` de hoy, sin tocarlo, con `winner = principal`. Todas las plantillas valen: AJILEI, empates, retiros y el desempate «por ser la Mano» quedan bien dichos.
5. **Otras:** las capas de otro dueño (disputadas, y lo ganado sin disputa), agrupadas por asiento y sumadas, con la voz de APU-1: «El pozo se partió: IA 2 se lleva 400. Te llevas otros 900 Heptacoins.»
6. **Devoluciones**, al final y en orden de asiento: «Se te devuelven N Heptacoins.» · «A la IA se le devuelven N Heptacoins.» (mesa de 2) · «A IA k se le devuelven N Heptacoins.» (mesas de 3 a 5). Sin «El pozo se partió:» delante si es lo único que hay (D3).
7. **Tono:** `gana` si el principal eres tú. Si no, `pierde`, salvo que tu neto sea positivo (P-2; recomiendo `neutro`).
8. **Celebración:** el nivel y las monedas siguen al principal (`mano` o `ajilei` si eres tú; `recoleccion` si es una IA). Lo que se retiene durante el vuelo es **lo que cobra el principal**, no el pozo entero.
9. **«Manos ganadas»** = el principal eres tú. Es la misma regla que ya usa el récord del servidor (`finDeMano`), así que los dos contadores dirán lo mismo.

Distribución del tono con la regla, en el barrido con IA real: mesa 2: 8 `gana` y 30 `pierde`; mesa 3: 19 · 114 · 1 `neutro`; mesa 4: 28 · 213 · 5; mesa 5: 25 · 324 · 4.

### D.3 · Alternativas para el tono cuando ganas sin la principal (P-2)

| | Regla | A favor | En contra |
|---|---|---|---|
| a | La hipótesis tal cual: `pierde` | La más simple; el tono y el titular nunca se contradicen | El óvalo te pinta de derrota con +1.800 en C10c. D8 queda cojo: el color dice lo contrario que tus fichas |
| b | Por el signo de tu neto: `gana` | El color nunca miente sobre tus fichas | «IA 2 gana con…» pintado de victoria: el titular y el color se contradicen |
| **c** | **`neutro`** (recomendada) | Ninguno de los dos miente: el titular dice quién tuvo la mejor mano y la cola «Te llevas otros N» da la buena noticia. Sin pulso dorado ni monedas hacia ti (no ganaste la mano) | Un tercer estado en la mano. Ya existe (`TONOS`, `resultadoCore.js:46`; lo usa el fin de partida), así que no es CSS nuevo |
| d | El titular para ti si tu capa disputada es mayor que la principal | Cuenta la historia por el dinero | Deja de nombrar la mejor mano; y si hay tres capas se vuelve una regla de pesos |

---

## 6. §E · La devolución y el espacio

### E.1 · La frase de hoy y con D6

| | Hoy | Con D6 |
|---|---|---|
| Capa sin elegibles | «N vuelven sin igualar.» (`cronicaCore.js:201`, literal, sin clave) | una oración por asiento: «A IA k se le devuelven N Heptacoins.» / «Se te devuelven N Heptacoins.» |
| Sobrante de un solo elegible | **ninguna**: su dueño es el titular | «A la IA se le devuelven N Heptacoins.» (mesa de 2) · «A IA k se le devuelven N Heptacoins.» (3 a 5) |

Detalle: el modo `apu` del arnés exige `/se lleva|vuelven|Te llevas/` cuando hay «El pozo se partió» (`diagDSK.mjs:3220`). «devuelven» contiene «vuelven», así que sigue verde (§G).

### E.2 · Las frases más largas

**Cómo se midió.** Con una sonda del scratchpad (`medir_voz3.mjs`) contra `vite preview` en el 4173, sobre el `dist` de este árbol (el que compiló `tab`). La sonda no añade ningún modo al arnés: reutiliza, sin tocarlos, `abrirCeldaEnPago` y `MEDIR_VOZ2` de `scripts/voz2/voz2Mesa.mjs` y el terreno común (`scripts/arnes/comun.mjs`) con la escala real. Por celda: se juega una mano hasta el pago, se ponen las frases en el `.voz2-texto` real y se mide con la vara de VOZ-2: los caracteres que se leen antes del «…», las líneas, el ancho en una línea (lienzo con la letra del texto) y las cajas del óvalo y del `<p>`. Aislamiento verde: 24 contextos, 0 escapadas.

Las formas medidas son las de la regla de §D.2, con «Copas, 41 pts» y montos de 700. Y una forma **peor factible**: el titular más largo (empate de N AJILEI resuelto por cercanía a la Mano), todas las capas ajenas posibles y una devolución a cada asiento, con montos de seis cifras.

| Forma | m2 | m3 | m4 | m5 | Ancho en una línea (13 px) |
|---|---|---|---|---|---|
| C1 «¡Ganas con Copas, 41 pts! A … se le devuelven 700 Heptacoins.» | 65 | 64 | 64 | 64 | 406–410 px |
| C3 «… gana con Copas, 41 pts. Se te devuelven 700 Heptacoins.» | 61 | 60 | 60 | 60 | 381–389 px |
| C6b empate «… Gana … por ser el más cercano a la Mano. A … se le devuelven…» | 100 | 98 | 98 | 98 | 613–621 px |
| C10a AJILEI | 73 | 72 | 72 | 72 | 458–462 px |
| C5 capa intermedia (m4/m5) | — | — | 137 | 137 | 834 px |
| peor factible | 98 | 192 | 258 | 321 | 631 · 1.200 · 1.608 · 1.996 px |

En el barrido, la más larga **real** fue de 77 (m2), 136 (m3), 175 (m4) y 226 (m5) caracteres al azar, y de 69, 127, 135 y 122 con la IA real. Las de 175 y 226 son las devoluciones múltiples de la capa sin elegibles (R-6). El titular más largo es de 59 a 63 caracteres en las cuatro mesas, y **es el mismo de hoy**: VOZ-3 no añade plantillas de titular.

### E.3 · ¿El titular entra entero en las dos líneas visibles?

Caracteres leídos antes del «…» frente a la longitud del titular. ✓ = el titular entero se lee.

| Vista (clase, factor, letra, caja de la frase) | m2 | m3 | m4 | m5 |
|---|---|---|---|---|
| 360×640 (celular, ×1, 13 px; caja 272 · 272 · 73 · 73 px) | ✓ todos (C6b: 83 de 100, titular 60 ✓) | ✓ todos | ✗ todos: se leen 16–20 (p. ej. «¡Ganas con Copas, 4…») | ✗ todos: 16–20 |
| 390×844 (celular, ×1, 13 px; 302 · 302 · 95 · 95) | ✓ todos | ✓ todos | ✗ todos: 23–26 | ✗ todos: 23–26 |
| 915×412 S25 acostado (sin atributo, ×1; 12 px en m2 y 9 px en m3–5; caja 135 · 236 · 113 · 114) | ✓ C1, C3, C10a · ✗ empate y multi (41–43 de 60–63) | ✓ todos | ✓ C1, C3, C10a, C5 · ✗ empate y multi (46–47) | igual que m4 |
| 1366×623 `h` (×0,874, 15 px; 506 · 383 · 347 · 347) | ✓ todos (la frase entera cabe, sin «…») | ✓ todos | ✓ todos | ✓ todos |
| 1280×577 `hb` (×1; 12 px en m2, 10 px en m3–5; 135 · 236 · 113 · 114) | ✓ C1, C3, C10a · ✗ empate y multi | ✓ todos | ✓ C1, C3, C10a, C5 · ✗ empate y multi (42–43) | igual que m4 |
| 744×1100 `tv` (×1,301, 13 px) | ✓ todos (cabe entera) | ✓ todos | sin cifra fiable (ver nota) | sin cifra fiable |

Lectura:
- **Donde el titular no entra, ya no entraba hoy.** Las cajas estrechas (73–95 px en m4/m5 vertical; 113–135 px en el S25 acostado y en `hb`) son las de VOZ-2 (C-2) y TAB-2, y las plantillas del titular son las mismas. Hoy se lee «IA 1 gana con Bast…» y con VOZ-3 se leerá «¡Ganas con Copas, 4…». **Lo que importa se ve:** en todas las celdas se lee el sujeto («¡Ganas…», «IA 1 gana…», «La IA gana…»), salvo en el empate a 16–20 caracteres («Empate, 31 pts. Gan…»). Ahí el sujeto lo da el color.
- **La devolución nunca desplaza al titular**, porque va detrás: las cifras de C1 y C3 son las mismas que con el titular solo.
- **Nota de instrumento (tv m4/m5):** bajo la escala ×1,301 el clon con el que `MEDIR_VOZ2` estima los leídos sale con 0 px de ancho (`clientWidth` = 0 en ese `<p>`), y la cifra (4–14) no vale. Por geometría es la caja del celular ampliada (el traje A ×f), así que se espera lo mismo que en 360×640. No lo doy por medido.

### E.4 · Recorte, globo y O1 con la frase más larga

- **O1 al byte:** en las **24 celdas × 6–7 formas**, el óvalo se mueve **0 px** y el `<p>` de la frase **0 px** frente a su frase real. La pantalla no desplaza (`scroll` 0), y al restaurar el texto las anclas quedan idénticas (`restaurado` en las 24).
- **Recorte y globo:** con la forma peor, la marca del producto (`data-voz2-recortada`) sale `1` y el globo se abre **dentro de la ventana** en 22 de 24 celdas. En las dos restantes (1366×623 m2 y 744×1100 m2) la frase peor de la mesa de 2 cabe entera (98 de 98), no hay «…» y no hay nada que desplegar: es el comportamiento sellado de VOZ-2, no un fallo. El globo más alto: 197,6 px en 744×1100 m5. El de 360×640 m5 mide 171 de 640.
- **Salvedad del globo:** el texto del globo lo pone React con la frase real de la mano. La sonda abre el globo y después le pone la frase peor para medir su caja. La colocación (`colocaCapa`) se calculó con el alto de la frase real, así que la cifra «dentro de la ventana» es la de una caja más alta en la misma posición. Basta para saber que cabe; no prueba la colocación exacta (la vara de eso es V-vuelo de `tab`, verde hoy).

---

## 7. §F · Textos

- **Claves de `textos.js` afectadas hoy: ninguna.** Toda la voz del óvalo son literales de `resultadoCore.js` y `cronicaCore.js` (A.3).
- **Frases nuevas** (con la moneda de `MONEDA`, `cronicaCore.js:27`):
  - `Se te devuelven {n} Heptacoins.`
  - `A la IA se le devuelven {n} Heptacoins.` (mesa de 2)
  - `A {nombre} se le devuelven {n} Heptacoins.` (mesas de 3 a 5)
  - Singular «1 Heptacoin»: **no se alcanza**. Los montos son múltiplos de la apuesta de mesa (≥ 10, `ajileiConfig.js:21-22`), y el menor vuelto posible es una apuesta. Aun así, la plantilla debería llevar el plural por regla («se le devuelve 1 Heptacoin» / «se le devuelven N Heptacoins») para no depender de esa garantía.
  - Desaparece `{n} vuelven sin igualar.`
- **Recomendación:** dejarlas **como literales en `cronicaCore.js`**, junto a la voz de APU-1. Pasar solo estas tres a `textos.js` dejaría la voz del óvalo partida en dos sitios. Que la migre entera IDI-1.
- **Nota para IDI-1:** la frase compuesta de VOZ-3 es más larga que la de hoy cuando hay devolución (+32 a +43 caracteres por devolución, en castellano). El portugués y el francés suelen salir un 15–30 % más largos. La vara es la misma de §E.3, por ancho real y nunca por caracteres (VOZ-2 D4): que el titular entre entero en las dos líneas visibles en 360×640 y en `hb`.

---

## 8. §G · El arnés

### G.1 · Qué mide hoy la frase o el ganador, y qué cambiaría a propósito

| Vara | Qué mide | ¿Cambia con VOZ-3? |
|---|---|---|
| `scripts/testMesaAPU1.test.js` §6 (`:740-830`) | la cola de `componeCapas` | **Sí, a propósito.** `:789` fija «El pozo se partió: 400 vuelven sin igualar.» (pasa a la forma de D6). `:760`, `:819` y `:827-828` siguen si `componeCapas` conserva su firma; si recibe la lectura nueva, se reescriben con el mismo contenido. |
| `scripts/testResultado.test.js` | `composeResultado` con `winner` dado | **No.** La regla cambia quién se le pasa, no la función. |
| `scripts/testCelebracion.test.js` (`:38-67`) | `decideCelebracion` con `winner` dado | **No** (misma razón). |
| `src/hooks/mesaIACore.test.js` | `finDeMano` con la capa 0 | **No.** Ya es la regla nueva. |
| `diagDSK msg` (`:10637`, `:10721`, `:10790-10820`) | re-deriva la frase desde las cartas y la compara | **No cambia su referencia, pero hay que saber esto:** su ganador (`idxGana`) se lee del chip de puntos de la **propia pantalla**, que hoy sigue a `game.winner`. No es un oráculo independiente del ganador: en C1 y C3 hoy saldría verde con la frase mala. Con VOZ-3 el chip sigue al principal y el oráculo con él. Con capas solo exige `startsWith` del titular, y eso sigue valiendo. |
| `diagDSK apu` (`apu.5`, `:3205-3225`) | que el pozo se parta y la cola esté bien formada | **No.** La regex acepta «devuelven». Una frase de C1 sin «El pozo se partió» también pasa. |
| `diagPUE voz2` (`scripts/voz2/voz2Mesa.mjs:88-111`) | las 9 formas de la Fase 0 de VOZ-2, incluida la «peor» con «100000 vuelven sin igualar.» | **Sí, a propósito.** Las formas `peor`, `IA+tellevas` y `corriente+1capa` cambian de texto con D6. La vara (la frase no mueve el óvalo y el recorte marca bien) no cambia; las longitudes de referencia, sí. |
| `diagDSK tab` V-hb (`scripts/tab/tab.mjs:1094-1125`) | resultado con «…» usando `LARGA_VOZ2`, O1 al byte, la crónica | **No.** Usa una frase fija suya. |
| `diagDSK vc` y la celebración | nivel y vuelo de la mano ganada | **No** en las manos del molde (no hay all-in). |

**Distinguirlo de un defecto:** las únicas referencias que cambian a propósito son las que contienen «vuelven sin igualar» o el sobrante como titular. Cualquier otro rojo de `msg`, `apu`, `voz2` o `tab` tras VOZ-3 es un defecto, no una referencia que retomar.

### G.2 · La vara nueva

**Vitest, no un modo de pantalla.** Lo que VOZ-3 decide es puro, y este proyecto no tiene jsdom.

- `scripts/testVoz3.test.js` (nuevo): los casos C1 a C10 de §C, en las mesas donde aplican, con el **motor real**. Se construye el estado a mitad de `BET_3` y la última acción va por `applyBetAction`, como en la sonda. Por caso se exige: el principal, el titular exacto, el tono, el nivel de celebración, el asiento destino del vuelo, la retención (= cobro del principal), `gano` para «Manos ganadas», las devoluciones por asiento y que `Σ cobro = pozo` cuadre con `chips` del motor. Más tres guardas:
  - **control al byte:** con una sola capa, frase, tono y nivel idénticos a los de hoy (C9, C10b, ruta de retiros);
  - **D8 por barrido:** 1.500 mesas por tamaño con semilla fija; el principal siempre con neto > 0, y el cobro reconstruido igual al del motor;
  - **concordancia con el servidor:** `gano` de la sesión === `finDeMano(state).ganoHumano` en todos los estados del barrido.
- **El arnés de pantalla**, sin modo nuevo: una celda en `diagPUE voz2` con la frase C1 real (la mesa no se puede llevar a un all-in con el molde de hoy; ver Riesgos R-4) y las formas de D6 en su lista. Si la Fase 1 quiere ver C1 pintado de verdad, hace falta un molde nuevo (`?apu=allin`, P-6).
- **INV-63 (propuesta para el registro):** *«Quien gana la mano es quien gana la capa principal (VOZ-3).»* El titular, el tono, la celebración, el destino de las monedas, la retención y «Manos ganadas» se deciden por el ganador de la capa 0, nunca por `state.winner`. La capa de un solo elegible devuelve lo propio y nombra lo ajeno como ganado. Quien sale como ganador tiene neto > 0. Una mano sin pozo partido se dice igual que antes. Fuente: el núcleo nuevo y `cronicaCore.js`. Vara: `testVoz3.test.js` y `mesaIACore.test.js`. Estado: vigilado.

---

## 9. Riesgos

- **R-1 · El retenido del saldo.** Corregir el destino del vuelo sin corregir la cifra retenida deja la pila del principal bajando de más en cuanto cobran dos asientos. Las dos cosas van juntas (§B fila 9).
- **R-2 · Una sola fuente.** Hoy siete consumidores leen `game.winner` por separado (§B). Si la Fase 1 cambia cada uno con su propia cuenta, volverán a divergir. Recomiendo un solo núcleo puro, `lecturaDeMano(state)`, que todos consuman (es el molde de `finDeMano`).
- **R-3 · `componeCapas` cambia de contrato.** Hoy recibe `ganadorPrincipal` y salta sus capas. Con VOZ-3 necesita saber qué parte de cada capa es vuelto. Mejor que reciba la lectura entera que repetir la cuenta dentro.
- **R-4 · El arnés no ve un all-in.** `vcHastaVictoria` y `jugarMano` no pulsan «All-in» por defecto (ARN-3d, H3d-ii-1) y el molde `?apu=gana` está hecho para que el humano gane sin capas. Sin un molde nuevo, la pantalla de C1 solo la verá Victor.
- **R-5 · El comentario del motor.** `gameEngine.js:195-197` afirma algo que el barrido desmiente (una mano por retiros con un all-in en pie). No hace falta tocarlo para VOZ-3 y no lo propongo. Se consigna por si un día se abre el motor por otra razón.
- **R-6 · Retirarse sin apuesta viva.** `pozos.esLegal` deja «retirarse» aunque se pueda pasar (`pozos.js:129-130`). Es lo que hace alcanzable la capa sin elegibles en el barrido al azar. Con la IA real no apareció ninguna en 6.000 mesas; con un humano que se retira sin necesidad, sí puede. VOZ-3 la dice bien igual (una devolución por asiento). Si la fila de botones lo permite o no es otra conversación.
- **R-7 · La tarjeta de sesión cambiará cifras.** «Manos ganadas» y sus puntos (`GameTable.jsx:2306`) subirán o bajarán respecto a hoy en las manos con pozo partido. Es la corrección, pero un tester que compare partidas antes y después verá números distintos.

---

## 10. Preguntas al rector

1. **P-1 · ¿Se aprueba la regla de §D.2?** (titular, cuentas, cobro y «Manos ganadas» por la capa 0). *Recomendación: sí.* Es la hipótesis del rector con las tres correcciones medidas.
2. **P-2 · El tono cuando ganas fichas sin la principal (C5, C10c).** *Recomendación: (c) `neutro`*, sin pulso dorado y con las monedas al principal. Las alternativas, en §D.3.
3. **P-3 · Las formas de D6 que faltan.** (a) El humano: *«Se te devuelven N Heptacoins.»* (b) Varios a la vez (capa sin elegibles): *una oración por asiento, en orden de asiento.* (c) La parte ajena de una capa de un elegible (C10f): *«IA 1 se lleva 300.»* en la cola de APU-1 y *«A IA 1 se le devuelven 800 Heptacoins.»* al final, en vez de una sola cifra de 1.100 que sería falsa. *Recomendación: las tres como están escritas.*
4. **P-4 · ¿Se dice la devolución cuando va al propio principal?** (C2, C4, C6b: «La IA gana con Copas, 41 pts. A la IA se le devuelven 700 Heptacoins.»). *Recomendación: no.* Hoy esas frases son correctas, ahí no hay nada que corregir, y la devolución al que ya ganó todo no cambia la lectura. Si se omite, C2, C4 y C6b quedan al byte.
5. **P-5 · Las monedas cuando cobran varios.** Hoy vuelan a un solo destino (VIS-3: siete monedas, un destino). *Recomendación:* que vuelen al principal y que la retención sea solo lo que cobra él. Que las devoluciones no vuelen (son fichas que no se movieron) y aparezcan al aterrizar, como hoy cualquier cobro que no es el del ganador. Vuelos múltiples serían otra campaña.
6. **P-6 · ¿Molde de pantalla para C1?** Un `?apu=allin` que siembre una mano con el humano corto y la mejor mano permitiría ver C1 pintado en el arnés y no solo en Vitest. *Recomendación:* sí, pero dentro de la Fase 1 y solo en 5173, como `?apu=` hoy.
7. **P-7 · El normativo.** `AJILEI_APU-1_Reglas_v1.3.md:158` y `:171` dicen «`winner` es el ganador de la capa superior» y «la capa sin elegibles se anuncia como dinero que vuelve». *Recomendación:* una v1.4 de las Reglas en la Fase 1, que diga que la mano la gana la capa principal y recoja la redacción de D6.

---

## 11. Plan de la Fase 1

Ninguna sub-tanda abre un protegido. Lámina: **solo si P-2 sale `neutro` o P-5 cambia algo visible** (el color neutro en el óvalo del resultado no se ha visto nunca en una mano; el fin de partida sí lo usa). Si P-2 es (a) y P-5 como se recomienda, no hace falta lámina: no hay forma visible nueva, solo frases distintas en la misma caja.

| Sub-tanda | Qué | Archivos | Min. |
|---|---|---|---|
| **1a · el núcleo** | `lecturaDeMano(state)` pura: principal, cuentas por asiento, cobro, tono, nivel, destino y retención. `componeCapas` pasa a recibirla y gana las devoluciones de D6. `testVoz3.test.js` con C1–C10, control al byte, D8 por barrido y concordancia con `finDeMano` | `src/hooks/mesaCore.js` (o un núcleo nuevo `src/hooks/manoCore.js`), `src/hooks/cronicaCore.js`, `scripts/testVoz3.test.js` (nuevo), `scripts/testMesaAPU1.test.js` (`:789`) | 60–75 |
| **1b · la mesa** | `GameTable.jsx` consume la lectura: `resultado` (`:507-514`), `capasTexto` (`:1546-1547`), `showdownWinnerSeat` (`:1552-1555`), destino del vuelo y retención (`:614-646`, `:979-989`), `useCelebracion` (`:911-920`) y `useSesion` (`:656-662`). Tono `neutro` si P-2 = (c) | `src/components/GameTable.jsx` (y `src/hooks/resultadoCore.js` solo si el tono se decide allí) | 45–60 |
| **1c · el arnés** | Las formas de D6 en `formasVoz2`; la celda C1 si P-6 = sí (molde `?apu=allin`); `diagPUE voz2`, `diagDSK msg`, `apu` y `tab` verdes; INV-63 en el registro; Reglas v1.4 (P-7) | `scripts/voz2/voz2Mesa.mjs`, `src/dev/` (molde), `docs/AJILEI_Invariantes_v1.0.md`, `docs/AJILEI_APU-1_Reglas_v1.4.md` | 60–90 (sin contar el tiempo de los modos: `tab` ~25 min, `voz2` y `msg` en paralelo) |
| **1d · cierre** | Informe, prueba de Victor en el teléfono (C1 y C3 a mano) | `docs/reportes/` | 20 |

Total: **~3 h a 4 h de Claude Code**, más las corridas del arnés.

---

## 12. Cierre

- **Huellas:** las seis, idénticas al empezar (18:30) y al terminar (18:58), por `diff` del sha256 entero, el blob y las líneas.
- **Node y puertos:** ningún `node.exe` vivo; nada escuchando en 4173, 4174, 5173 ni 5174. El 4173 lo levantaron en su proceso `tab` y la sonda de §E, y se cerró con cada uno.
- **`git status`:** el informe nuevo y los residuos conocidos, nada más:
  ```
  ?? docs/reportes/AJILEI_MOT-1_Fase0_Informe_v1.0.md
  ?? docs/reportes/AJILEI_MOT-1_Fase1-0_Sonda_Informe_v1.0.md
  ?? docs/reportes/AJILEI_VOZ-3_Fase0_Informe_v1.0.md
  ?? laminas/mon1/_entorno.txt
  ?? laminas/mon1/lamina.html
  ?? laminas/mon1/tiempos.json
  ```
  `tab` recompiló `dist/` (ignorado por git), como en cualquier corrida del modo.
- **Sin uniones `node_modules`.** Las sondas importan los módulos del repo por ruta absoluta (`file:///…`) y usan el gancho `scripts/_resolveExt.mjs` del propio repo. La sonda de §E se corrió con el repo como directorio de trabajo, porque `hostSupabase` lee `.env.local` desde ahí (el primer intento, desde el scratchpad, falló las 24 celdas por eso).
- **Lo que queda en el scratchpad** (`C:\Users\victo\AppData\Local\Temp\claude\c--Users-victo-OneDrive-Documents-ajilei\4ddc44bc-2426-4d4c-8932-a9dc3dfaaed8\scratchpad\`), sin borrar:
  - `sonda_voz3.mjs` → `casos_voz3.json`, `casos_voz3.txt`: los 61 casos de §C;
  - `voz3proto.mjs`: el prototipo de la regla de §D.2 (no es código del repo);
  - `fuzz_voz3.mjs`, `fuzz_voz3b.mjs`, `fuzz_voz3c.mjs` → `fuzz_voz3*.json`: el barrido de formas (al azar; afinado; con la IA real);
  - `fuzz_proto.mjs`: el prototipo sobre el barrido (cuadre, D8, frases más largas);
  - `medir_voz3.mjs` → `medida_voz3.json`, `medida_voz3.txt`: la medida de §E;
  - `vitest1.txt`, `lint.txt`, `tab.txt`, `huellas_inicio.txt`, `huellas_fin.txt`: la línea base.
- **Tiempo:** de 18:30 a 19:00, dentro del tope de 60 min. No falta nada de la ficha. Lo único sin cifra fiable es la tableta vertical en m4/m5 de §E.3 (nota de instrumento).

**STOP.** Sin `git add`, sin commits. La Fase 1 espera a las respuestas de §10.
