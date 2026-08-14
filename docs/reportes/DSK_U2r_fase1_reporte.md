# DSK-U2 (reformulada) · Reacciones entre jugadores — Fase 1: diagnóstico read-only

**Base de código:** HEAD `b1d9359`. **Naturaleza:** solo lectura. Ensayos aplicados y revertidos
**en página**; `src/` sin tocar (verificado con `git status --porcelain src/`).
**Sondas:** `_u2anchor.mjs` · `_u2anchor2.mjs` (20 celdas × 2 estados × 2 colocaciones) ·
`_u2selector.mjs` (20 celdas × 3 rejillas) · `_u2ink.mjs` (12 celdas). Salidas en `capturas-dsk/_u2*.json`.
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md`.

> **Nota de premisa.** Este reporte sustituye el alcance del anterior
> (`DSK_U2_fase1_reporte.md`), que partió de leer 💬 como conmutador de los mensajes del juego.
> Aquel queda *untracked* para la limpieza de campaña. Del censo anterior **sobreviven como
> insumo**: (a) el mapa de rendering del óvalo y sus dos modos de layout, (b) los 10 sitios
> `setGame` y la desambiguación por transición `(prev, next)` —reutilizados aquí en §5 como
> ganchos de evento—, y (c) la deuda del gancho `is-off`, que **ya sólo afecta a Sonido** y queda
> anotada como deuda, **fuera de esta tanda**. Las sondas `_u2probe/_u2echo/_u2fams` también
> quedan para la limpieza; `_u2dbg.mjs` es un tanteo desechable del mismo lote (el borrado no
> está permitido en esta sesión: se marca para la escoba).

---

## 1 · La lista de frases — **NO está en el repositorio**

Búsqueda exhaustiva (`reacc|reaccion|emoji|burbuja|bubble|chat|frase|selector` sobre `docs/`,
`README.md` y todo `src/`): **cero coincidencias** con una lista de reacciones. Los únicos ecos de
"burbuja" son el icono del **Asistente IA** de `Menu_Utilidades_v1.0` §3.3 — la entrada
descartada en v1.1 §2.1 — y el `💬` de la entrada Mensajes en `UtilitiesMenu.jsx:69`. No hay
tampoco rastro en el historial de commits.

**Consecuencia:** las ~10 frases **se sellan en la enmienda documental de esta tanda, antes de
implementar** (§7). Es un bloqueo de contenido, no técnico.

**Cautela cuantificada.** Para poder medir hubo que asumir un juego provisional de 10 frases,
marcado como PLACEHOLDER en las tres sondas. Con la tipografía viva, la más ancha
(`¡Buena jugada! 👏`) mide **112,53px** de texto → cuerpo de burbuja de **134,53 × 30,89**
(+8 de pico = 38,89 de alto). **Todos los porcentajes de oclusión de §2 escalan con ese ancho**:
si la lista sellada trae frases más largas, la cifra crítica del humano (§2.3) empeora. La
sonda recalcula sola — el ancho se deriva midiendo las frases, no está cableado.

---

## 2 · Anclajes de burbuja — las dos rutas + la banda humana

### 2.1 Geometría de los tres anclajes

| Ruta | Mesas | Elemento | Reserva | Ancho caja | Ancho tinta |
|---|---|---|---|---|---|
| `OpponentPanel` | 5 / 4 / 3 | `.opp-name` | **12ch fija** (`min=max`, `text-align:left`, `ellipsis`) — [gameTable.css:4208-4216](../src/styles/gameTable.css#L4208-L4216) | 86,75 | 23,14 (`"IA 1"`) |
| `.ai-zone` legacy | 2 | `.ai-name` | 12ch fija, gemelo DSK-H2 | 86,75 | 12,66 (`"IA"`) |
| banda humana | las 4 | `.pbr-name` | celda de grid estirada (`min/max: auto/none`) | 93,42 | 17,47 (`"Tú"`) |

> ### ⚠ Hallazgo 1 — el pico NO puede centrarse en la caja del nombre
>
> La reserva de 12ch de DSK-P1/H1/H2 hace que la **caja** sea mucho más ancha que la **tinta**, y
> el texto va alineado a la izquierda. Desfase medido entre el centro de la caja y el centro de la
> tinta, **constante en los 3 viewports muestreados**:
>
> | Ruta | Desfase | Ancho de la tinta |
> |---|---|---|
> | `OpponentPanel` (5/4/3) | **31,80px** | 23,14 |
> | `.ai-zone` (mesa 2) | **37,05px** | 12,66 |
> | banda humana | **37,98px** | 17,47 |
>
> El desfase **supera al ancho del propio nombre** en las tres rutas: un pico centrado en la caja
> apuntaría a espacio vacío, no al nombre. El anclaje debe hacerse contra el rect del **Range**
> (`document.createRange().selectNodeContents(el)`), técnica que el arnés ya usa (`__textRect`,
> `diagDSK.mjs`). Y como el reserve tiene `ellipsis`, hay que reanclar si algún día un nombre lo
> desborda.

### 2.2 Aire vertical disponible (tokens vivos)

| Franja | Tier carta 76 (alto <900) | Tier carta 91 (alto ≥900) |
|---|---|---|
| cabecera → fila de IAs (`headToRiv`, mesas 5/4/3) | **6** | **10** |
| cabecera → `.ai-zone` (mesa 2, `headToAi`) | **6** | **10** |
| cartas del humano → barra (`cardsToBar`) | **8** | **8** |
| óvalo → área humana (`ovalToZone`) | **6** | **10** |
| `.ai-zone` → área humana (mesa 2, `aiToZone`) | 140–188 | 188–190 |

**Ninguna franja libre admite una burbuja de 38,89px de alto** salvo el hueco central de mesa 2.
Es decir: **toda burbuja se superpone a algo por construcción**. La pregunta no es *si* tapa, sino
*qué*.

### 2.3 Qué tapa — 20 celdas × 2 estados × 2 colocaciones

Colocaciones: **centro** = cuerpo centrado en la caja del nombre · **izq** = filo izquierdo
alineado con el de la caja. `*` = asiento revelado en el showdown. Celdas idénticas colapsadas.

| Asiento | Estado | centro | izq |
|---|---|---|---|
| **mesa 5** side-left · top-left · side-right | inicio y showdown | **limpio** | **limpio** |
| **mesa 5** top-right | showdown | `Mano #N`: 1,23–2,53% | limpio |
| **mesa 4** los tres asientos | inicio y showdown | **limpio** | **limpio** |
| **mesa 3** top-left | inicio | `AJILEI`: 5,77–10,92% | `AJILEI`: 0–3,77% |
| **mesa 3** top-left | showdown | `AJILEI`: 10,32–17,79% | `AJILEI`: 2,64–8,99% |
| **mesa 3** top-right | showdown | `Mano #N`: 0–2,53% | limpio |
| **mesa 2** rival-2 | inicio y showdown | **`AJILEI`: 25,58–31,07%** | `AJILEI`: 20,15–24,46% |
| **humano** (las 4 mesas) | inicio y showdown | **cartas propias: 52,59% / 60,51%** | **62,08% / 71,44%** |

Los dos valores del humano son los dos tiers de carta (76px con alto <900 · 91px con alto ≥900).

> ### ⚠ Hallazgo 2 — la burbuja del humano tapa más de la mitad de su propio abanico
>
> **52,59%** (tier 76) y **60,51%** (tier 91) de `.player-zone .cards-row`, idéntico en las cuatro
> mesas y los cinco viewports. La causa es estructural, no de tamaño: `.pbr-name` vive en
> `.player-bar`, **debajo** de las cartas, y entre cartas y barra sólo hay **8px** (§2.2). Con el
> pico obligado a apuntar hacia abajo (triángulo invertido), el cuerpo cae necesariamente sobre el
> abanico. Alinear a la izquierda **empeora** (62,08% / 71,44%), porque el cuerpo se corre hacia
> el centro del abanico en vez de sobresalir por el margen del mazo.
>
> Es el único choque grave del sistema y es **decisión de diseño**, no de implementación. Tres
> mitigaciones que el terreno admite, sin recomendar una desde aquí:
> 1. **Bloquear el envío mientras el humano tiene turno vivo** (`BET_*` propio o `DISCARD`), que
>    es justo cuando necesita ver sus cartas. Se apoya en señales ya vivas (`isPlayerTurn`,
>    `isDiscardPhase`) y no cuesta geometría.
> 2. **Burbuja del humano más chica o a dos líneas más estrechas** — reduce el % pero no lo anula.
> 3. **Tratamiento propio para el emisor humano** (p. ej. eco discreto en la barra en vez de
>    burbuja). Rompe la simetría "visible para todos incluido el emisor" del encargo.

### 2.4 Δ=0 y el molde de capa

| Comprobación | Resultado |
|---|---|
| Δ de layout con la burbuja presente (9 anclas: área, `table-mid`, `rivals-zone`, óvalo, `ai-zone`, área humana, barra, cartas, cabecera) | **0,00 en las 20 celdas × 2 estados × 2 colocaciones** |
| La burbuja gana el hit-test (centro + puntos medios de los 4 filos) sobre paneles (z:1), paneles revelados (z:7) y todo el área | **OK en las 20 celdas** |
| ¿`html` o `body` crean contexto de apilamiento? | **No** (`{body:false, html:false}`) → un `fixed` a nivel de `body` vive en el contexto raíz |
| ¿La burbuja se sale del viewport? | **No**, en ninguna celda ni colocación |

**El precedente de `.opp-status` sirve a medias — importante.** Está `position:absolute` en las
**dos** rutas (`OpponentPanel` y `.ai-zone`) y su Δ es 0 con cualquier estrategia, incluido el
desmontaje: eso **valida la mitad "sin reflow"** del molde. Pero **no vale como molde de capa**:
vive *dentro* de `.opp-panel`, que es `position:relative; z-index:1` — y **7** cuando está revelado
— o sea, **un contexto de apilamiento**. Un hijo absoluto queda atrapado ahí y no puede pasar por
encima de un panel hermano. Peor: la coreografía R2 aplica `transform` a los paneles, y un
descendiente `fixed` se anclaría al panel transformado en vez de al viewport.

**Molde correcto:** hermano del área a nivel de `body`, `position: fixed`, anclado por rect
medido — exactamente `.utilities-panel` (U1 §9a: «ningún ancestro de la cadena tiene `transform`,
así que el `fixed` ancla al viewport y no hace falta portal») y `.flying-card`. Verificado aquí de
nuevo con `__ctxBody`.

---

## 3 · Capas

### 3.1 Censo vivo (medido, no declarado)

Recorrido de todo el DOM en 20 celdas × 2 estados, quedándose con el máximo por clase:

| z | Elemento | Naturaleza |
|---|---|---|
| **10** | `.pot-float` | **techo real medido dentro del área** |
| 7 | `.opp-panel` (revelado) | showdown |
| 5 | `.opp-card-slot` · `.card-slot-wrapper` | cartas |
| 4 | `.win-score-chip` | showdown |
| 2 | `.opp-corner-chip` | ficha de saldo |

Declarados que no aparecen en un censo estático (nacen por interacción):
**9** sobrevuelo Z1 (`--dsk-z1-panel-z`, sólo `:hover` + `pointer:fine`) · **30** `.utilities-panel`
· **31** `.utilities-popup` (`calc(--dsk-u1-panel-z + 1)`) · **100** `.leave-overlay` ·
**120** `.bankrupt-overlay` · **200** `.flying-card`.

### 3.2 Propuesta

| Capa | z propuesto | Justificación |
|---|---|---|
| **Selector en grilla** | **31**, como `calc(var(--dsk-u1-panel-z) + 1)` | Es **hijo conceptual del menú**: debe pintarse sobre su panel (30) y morir con él. Reutiliza la aritmética que U1b ya estableció para el popup del contador. *Conflicto aparente:* el popup ya ocupa 31 — pero **no coexisten** (el popup se cierra con «clic en cualquier otra parte», y pulsar 💬 lo es). Si se prefiere blindarlo, 32 con token propio. |
| **Burbujas** | **25** | Por encima del techo real del área (10), del sobrevuelo Z1 (9) y de los paneles revelados (7) — cumple «pasan sobre paneles». Por debajo de modales (100/120) — cumple «no sobre modales». Y **por debajo del panel del menú (30)**: si llega una reacción de IA mientras el humano tiene el selector abierto, la superficie que está tocando no se le tapa. |

**Alternativa a decidir:** burbujas a **40** (sobre el menú también), bajo el criterio de que el
evento más reciente manda. Cambia sólo un número; el hit-test se verificó con la burbuja a 40 y
también gana, así que ambas opciones están medidas y son viables.

### 3.3 El selector no cabe en el panel — dónde vive

El panel de utilidades mide **64px de ancho** (`--dsk-u1-panel-w`, U1b §10a). Un selector de ~10
frases no cabe dentro: es una **superficie propia**. Footprint derivado de tokens vivos
(frase más ancha 112,53 + padding 2×10 = **ítem de 133 × 44**, conservando los 44px de fila que
U1b exige), anclado como el panel (filo derecho al filo derecho del ⋮, abajo):

| Rejilla | Tamaño | ¿Cabe en las 20 celdas? | Δ | hit | Oclusión (rango sobre las 20 celdas) |
|---|---|---|---|---|---|
| **2×5** | **277,06 × 244** | **sí** | 0 | OK | cartas rival 13,66–22,41% · óvalo 1,58–14,27% · header IA 5,79–13,20% · **mesa 2: cartas rival 51,64–63,93%** |
| 1×10 | 140,53 × 484 | sí | 0 | OK | óvalo **26,45–36,58%** · cartas rival 3,54–32,23% · cartas humano 3,31–19,01% |
| 3×4 | 413,59 × 196 | sí | 0 | OK | cartas rival 6,43–23,23% · **mesa 2: 64,29–69,79%** · header IA 9,03–16,44% |

**2×5 es la menos mala**: no toca nunca las cartas del humano ni los botones, y su peor caso
(mesa 2) es el más bajo de las tres. 1×10 es la peor para el óvalo; 3×4 la peor para el rival de
mesa 2. En las tres, el peor escenario es **mesa 2**, porque `.ai-zone` es ancha y cae justo bajo
el ⋮. Atenuante real: el selector es **transitorio** (abre → eliges → cierra), no persistente.

**Sub-decisión medida:** las cifras de arriba anclan el selector **en el mismo sitio que el panel**,
o sea el selector **tapa el panel**. Si se prefiere que abra **al lado** (panel visible a su
derecha), hay que desplazarlo 64+6=70px a la izquierda: comprobado que **cabe con holgura** —
en la peor celda (mesa 2 @1024, rejilla 3×4) quedan **393,8px** de margen al filo izquierdo.

---

## 4 · Infraestructura de animación y candado

### 4.1 El ciclo 0,3 / 2,4 / 0,3 ya existe, con otra duración

| Precedente | Dónde | Qué aporta |
|---|---|---|
| **`elimNotice`** | [gameTable.css:771-790](../src/styles/gameTable.css#L771-L790) | **Es la forma exacta pedida.** `0% op:0 · 8% 1 · 86% 1 · 100% 0`, `3.75s ease-out forwards`. Para 0,3/2,4/0,3 (total **3,0s**) los topes son **10% / 80% / 100%**. Sólo cambian números. |
| **`potFloat`** | [gameTable.css:169-184](../src/styles/gameTable.css#L169-L184) | El **molde estructural del overlay efímero**: fuera de flujo, `pointer-events:none`, `z-index`, `animation … forwards`, y en JS un `setTimeout` con **guardia de id** — `setPotAnim(a => (a && a.id === id ? null : a))` ([GameTable.jsx:296-305](../src/components/GameTable.jsx#L296-L305)). Esa guardia es justo lo que la X anticipada necesita para no matar una burbuja posterior. |
| `msgPop` | [gameTable.css:208-219](../src/styles/gameTable.css#L208-L219) | `0.3s ease-out`, `scale .8 → 1.06 → 1` + opacidad. Entrada con carácter, ya del proyecto, y ya dura **exactamente 0,3s**. |
| `chipFloatInDSK` · `bankruptFade` · `bankruptRise` · `oppEliminate` | varios | Otras entradas/salidas del mismo lenguaje. |

Todos cumplen la ley del sistema §5.1 (**sólo `transform` y `opacity`**, más `box-shadow` para
halos). Ninguno dispara reflow.

**Riesgo heredado y documentado:** la duración vive **dos veces** — en el keyframe CSS y en la
constante JS que desmonta. `GameTable.jsx:38-42` ya lo advierte para `ELIM_NOTICE_MS`
(«debe ir en sync con la animación CSS `elimNotice`… misma duración»). La tanda debe nacer con
el mismo pecado o resolverlo con un token compartido — recomendable esto último, porque aquí
además la **X** puede cortar el ciclo a mitad.

### 4.2 Dónde vive `reaccionActiva`

**Hay dos consumidores en dos sitios distintos del árbol**, exactamente el problema que U1 ya
resolvió: el **selector** vive dentro de `UtilitiesPanel` (montado en
[GameTable.jsx:1538](../src/components/GameTable.jsx#L1538), hermano del área) y la **burbuja**
debe montarse como hermano del área también, pero es `GameTable` quien conoce los asientos y sus
rects. La respuesta del proyecto a ese patrón ya está escrita:

> *«Vive aparte de los componentes porque el disparador y el panel se montan en dos sitios
> distintos del árbol… Un solo estado, dos consumidores.»* — [useUtilitiesMenu.js:3-7](../src/hooks/useUtilitiesMenu.js#L3-L7)

**Propuesta:** un hook hermano `useReacciones()`, llamado en `GameTable`, que entrega
`{ bloqueado, enviar }` a `UtilitiesPanel` y `{ activa }` a la capa de burbujas. Estado interno
`{ id, seat, frase, nacida }` + `useRef` del timer, molde de los cinco overlays efímeros que ya
viven en `GameTable` (`potAnim`, `elimNotice`, `openChipSeat`+`chipTimerRef`, `shakeSeat`,
`revealAnim`) y del *cleanup* global de desmontaje ([GameTable.jsx:285-290](../src/components/GameTable.jsx#L285-L290)).

**La X libera el candado**: `clearTimeout(ref)` + `setActiva(null)`, calcado de `handleChipTap`
([GameTable.jsx:711-717](../src/components/GameTable.jsx#L711-L717)), que ya hace exactamente
*limpiar timer + conmutar*. Y su hitbox ≥40px sale del **patrón embaldosado B2**: `::after`
transparente con insets negativos sobre un elemento posicionado
([gameTable.css:4129-4185](../src/styles/gameTable.css#L4129-L4185)) — cero cambio visual, cero layout.

### 4.3 El timer corre indiferente — confirmado

El reloj es una cadena de `setTimeout` gobernada por `timeLeft` y guardada por `isPlayerTurnEarly`
/ `isDiscardTimerActive` ([GameTable.jsx:453-474](../src/components/GameTable.jsx#L453-L474)):
**no lee ningún estado de overlay**. Y `Menu_Utilidades_v1.1` §9b ya lo selló con medida («con el
modal de abandonar abierto, el reloj del descarte bajó de 20s a 17s en 3 segundos»). Una burbuja
`pointer-events:none` no puede interferir. Queda como puerta del arnés igualmente (§6).

---

## 5 · Respuesta de las IAs — factibilidad

### 5.1 El protegido y su puerta pública

`AJILEI_Sistema_Diseno_v1.2.md` línea 12: **«NO modificar `gameEngine.js` ni `aiPlayer.js` bajo
ninguna circunstancia.»** Confirmado que aplica a `aiPlayer.js` igual que al motor.

**Pero `aiPlayer.js` ya expone lo que hace falta, sin tocar nada:**

| Export | Firma | Uso para reacciones |
|---|---|---|
| `getPersonalityName(aiIndex)` | → `'CONSERVADORA' \| 'EQUILIBRADA' \| 'AGRESIVA' \| 'IMPREDECIBLE' \| null` | **lectura directa del perfil por asiento** ([aiPlayer.js:47-49](../src/engine/aiPlayer.js#L47-L49)) |
| `initPersonalities(numPlayers)` | reparte los 4 perfiles barajados entre los asientos de IA | ya público («also called directly by tests») |

Un módulo aparte (`reacciones.js` + `useReacciones`) puede leer el perfil y decidir la frase **sin
una sola línea nueva en el protegido**. Factibilidad: **sí**.

> ### ⚠ Hallazgo 3 — `getPersonalityName` devuelve `null` durante buena parte de la mano
>
> `_assignments` se inicializa perezosamente dentro de `_ensurePersonalities(state)`, que sólo se
> llama en `decideBetAction` **línea 102** — es decir, **después** de dos `return` tempranos: si la
> IA está `folded` ([:79](../src/engine/aiPlayer.js#L79)) o si tiene Ajilei
> ([:98](../src/engine/aiPlayer.js#L98)). Antes de la primera decisión de apuesta de una IA no
> retirada y sin Ajilei en la sesión, **el perfil es `null`**.
>
> Y llamar `initPersonalities()` desde fuera para adelantarlo **no es seguro**: `_ensurePersonalities`
> re-baraja cuando `isNewSession = state.handCount === 0 && _lastHandCount > 0`
> ([:59](../src/engine/aiPlayer.js#L59)), condición que se cumple al entrar a una mesa nueva —
> el perfil leído al montar podría **no ser** el que la IA acabe usando.
>
> **Camino limpio:** leer `getPersonalityName(seat)` **de forma perezosa, en el momento de
> reaccionar**, y tratar `null` como «aún sin perfil» → frase neutra. Toca cero líneas del protegido.

### 5.2 Ganchos de evento disponibles (todos en la capa de UI)

Este es el insumo que sobrevive del censo anterior: la señal estable vive en el par `(prev, next)`
de cada despacho, molde del `inferAction` que ya existe.

| Evento contextual | Señal viva | Dónde |
|---|---|---|
| acción de una IA (`Apostó/Subió/Igualó/Pasó/Se retiró`) | **`inferAction(prev, next, seat)`** — ya se calcula y se guarda en `lastActions` | [GameTable.jsx:133-145](../src/components/GameTable.jsx#L133-L145), usado en [:504-507](../src/components/GameTable.jsx#L504-L507) |
| acción del humano | el literal que recibe `act(action)` | [:551-555](../src/components/GameTable.jsx#L551-L555) |
| subida fuerte / salto de pozo | delta de `game.pot`, **ya computado** para el `+N` | [:296-305](../src/components/GameTable.jsx#L296-L305) |
| descarte por asiento (cuántas cartas) | `buildDiscardPlan` + `discardNarration(seat, n, g)` | [:160-180](../src/components/GameTable.jsx#L160-L180), [:611-642](../src/components/GameTable.jsx#L611-L642) |
| transición de fase | `prev.phase → next.phase` en los 10 sitios `setGame` | — |
| resultado / ganador / Ajilei | `showdownWinnerSeat`, `game.winner`, `players[w].score` | [:654-657](../src/components/GameTable.jsx#L654-L657) |
| eliminación | `next.eliminatedNames`, `runEliminationCeremony` | [:871-899](../src/components/GameTable.jsx#L871-L899) |
| turno y apremio | `turnSeat`, `timeLeft` | [:848](../src/components/GameTable.jsx#L848), [:453-474](../src/components/GameTable.jsx#L453-L474) |
| curiosear la mano ajena | `handleRevealTap(seat)` | [:693-703](../src/components/GameTable.jsx#L693-L703) |

Cobertura completa de los disparadores contextuales plausibles, **sin tocar ninguno de los dos
archivos protegidos**. Qué dice cada personalidad queda para el STOP, como pide el encargo.

---

## 6 · Bosquejo del arnés — modo `u2` nuevo

**Modo nuevo, no extensión de `u1`.** `u1` valida el contenedor del menú; `u2` valida un sistema
propio (selector + burbujas + candado). Mezclarlos haría que una regresión de reacciones se leyera
como una del menú.

**Matriz:** 4 mesas × 5 viewports = **20 celdas** (los 4 de campaña + centinela **1440×850**). La
sonda ya demostró que el centinela se gana el sitio: los porcentajes de oclusión del humano cambian
de 52,59% a 60,51% al cruzar el escalón de `--card-w`, y la matriz de 4 no lo vería.

| # | Puerta | Expectativa — derivada de tokens vivos |
|---|---|---|
| 1 | **Selector abre/cierra** | pulsar 💬 monta el selector y **cierra el panel** o lo conserva (según la sub-decisión de §3.3); `Esc` y clic fuera lo cierran; elegir una frase lo cierra. El listener de `useUtilitiesMenu` ya ignora lo que caiga dentro de `.utilities-*` → el selector debe entrar en esa lista, como entró `.utilities-popup` en U1b |
| 2 | **Pico sobre el nombre correcto** | centro del pico dentro del **rect de Range** del nombre emisor (no de su caja) en **ambas rutas**: `.opp-name` de 5/4/3 y `.ai-name` de mesa 2, más `.pbr-name`. Tolerancia derivada del ancho de tinta vivo, nunca de los 31,80/37,05/37,98 medidos hoy |
| 3 | **Ciclo de vida 0,3 / 2,4 / 0,3** | muestreo de `getComputedStyle().opacity` en el tiempo: sube en ≤0,3s, se mantiene ~2,4s, baja en ~0,3s, y el nodo **desaparece del DOM**. El total se lee del `animation-duration` vivo, no de una constante del arnés — así la puerta detecta la desincronización JS↔CSS que §4.1 señala |
| 4 | **Candado** | con burbuja viva, un segundo envío **no** monta una segunda burbuja (`document.querySelectorAll` de burbuja = 1 en todo momento); tras la salida, el envío vuelve a funcionar |
| 5 | **X libera antes de tiempo** | pulsar la X mata la burbuja **al instante** (siguiente frame) **y** permite enviar de inmediato — las dos mitades, porque liberar el candado sin matar la burbuja (o al revés) es el fallo probable |
| 6 | **Hitbox de la X ≥40px** | `elementFromPoint` sobre el hit REAL (incluido el `::after` de B2), en sub-pasada `pointer: coarse`, midiendo **ambos ejes** — molde exacto del modo `tactil` |
| 7 | **Δ=0 con burbuja presente/ausente** | snapshot de las **9 anclas** de §2.4 con y sin burbuja, tolerancia **0,02px** (cuantización 1/64). Más la puerta estructural: el nodo de la burbuja **no** es descendiente de `.opp-panel` ni de `.ai-zone` (si lo fuera, el `fixed` moriría con el `transform` de R2) |
| 8 | **Guardia de contenido** | la burbuja **jamás** toca `.action-buttons`, `.btn-mult`, `.timer-display` ni la banda «Tu mejor palo» — la misma guardia que U1 §9b impuso al panel. La oclusión del abanico humano se **mide y se reporta**, no se prohíbe: es decisión de diseño (§2.3) |
| 9 | **El reloj no se entera** | con burbuja viva 3 s, `timeLeft` baja ~3 — la medida que U1 §9b ya hizo con el modal, ahora con la burbuja |
| 10 | **Capa** | la burbuja gana el hit-test en centro + **puntos medios de los 4 filos** (no las esquinas: con `border-radius` caen fuera de la forma y dan falso negativo — verificado en el ensayo de depuración de esta fase) sobre panel revelado (z:7) y con Z1 activo (z:9); y **pierde** contra `.leave-overlay` (z:100) |

**Lección W1 vigente:** un clic por iteración y **rechequeo de estado antes del siguiente**. Aquí
muerde más que en el óvalo, porque abrir el menú, abrir el selector y elegir frase son tres
cambios de estado encadenados; el ciclo debe releer entre cada uno.

**Anti-cableado:** el ancho de la burbuja se deriva midiendo las frases con la tipografía viva
(la sonda ya lo hace), el ciclo del `animation-duration` computado, el hit de `elementFromPoint`
real, y el desfase del pico del rect de Range. Ningún literal de esta fase entra en el arnés.

---

## 7 · Plan de enmienda documental (se ejecuta en la implementación)

`AJILEI_Menu_Utilidades` sube a **v1.2**:

1. **Redefinir la entrada 💬** — de «toggle de mensajes» a **«Reacciones»**: abre un selector en
   grilla de ~10 frases con emoji; elegir envía y cierra.
2. **Archivar la clasificación imprescindible/narrativa como DESCARTADA**, con el **molde
   Sugerencias** de v1.1 §2.1 y §7.3: se marca descartada y **no se borra del historial
   documental**. Alcanza a §2 («Mensajes — semántica»), al apéndice **§9c/§9d/§9e** y a la entrada
   correspondiente del §8 de versiones. Nota de trazabilidad: los mensajes del juego quedan
   **siempre visibles, sin conmutador**.
3. **Sellar la lista de ~10 frases con su emoji** (§1: hoy no existe en el repo) — prerrequisito
   de implementación.
4. **Sellar los tiempos** 0,3 / 2,4 / 0,3 y la regla de **una burbuja a la vez**.
5. **Sellar la X anticipada**: glifo discreto, hitbox ≥40 por patrón embaldosado B2, mata la
   burbuja al instante y **libera el candado antes de tiempo**.
6. **Sellar el candado** y, si se decide, el **cooldown** adicional (STOP).
7. **Registrar el anclaje por tinta** (§2.1) y el **molde de capa** `fixed` a nivel de `body`
   (§2.4) como reglas, no como detalles de implementación: las dos son trampas que se repetirían.
8. Añadir a **§9 deudas** del sistema de diseño (o dejarla anotada aquí): el gancho **`is-off` sin
   regla CSS**, que ahora sólo afecta a Sonido y **no entra en esta tanda**.

---

## STOP

Terreno medido. **No hay bloqueo técnico**: la burbuja es overlay puro con **Δ=0 en las 20 celdas
× 2 estados × 2 colocaciones**, gana el hit-test sobre todo lo del área, el ciclo 0,3/2,4/0,3 es el
keyframe `elimNotice` con otros topes, el candado tiene molde (`potAnim` + `handleChipTap`), la X
tiene molde de hitbox (B2), y las IAs pueden reaccionar **sin tocar `aiPlayer.js`** gracias a
`getPersonalityName`.

**Un bloqueo de contenido y tres hallazgos que exigen decisión:**

| | Asunto | Estado |
|---|---|---|
| **0** | **La lista de ~10 frases no está en el repo** | **bloqueante** — se sella en la enmienda (§7.3) antes de implementar |
| **1** | **El pico no puede centrarse en la caja del nombre**: desfase 31,80 / 37,05 / 37,98px por la reserva 12ch | técnico, resuelto: anclar al rect de Range |
| **2** | **La burbuja del humano tapa 52,59–71,44% de su propio abanico**, por estructura (sólo 8px entre cartas y barra) | **decisión de diseño** — tres mitigaciones medidas en §2.3 |
| **3** | **`getPersonalityName` es `null` hasta la primera apuesta de IA** de la sesión, y adelantarlo con `initPersonalities` puede quedar desfasado por el re-barajado | técnico, resuelto: lectura perezosa + frase neutra |

**Pendientes que el encargo reserva al STOP:**

| | Decisión | Insumo medido |
|---|---|---|
| **A** | **Estilo visual de burbuja y selector** (autoridad v1.2) | tokens disponibles: `--surface-panel/--surface-area`, borde `rgba(--gold-brand-rgb, .45)`, radio 999/12, `inset 0 1px 0` — el «panel premium» de §3. Rejilla recomendada por medida: **2×5** (§3.3). Ojo con la **regla de contraste** (§5.6) sobre los emoji |
| **B** | **Alcance de la respuesta IA: en esta tanda o en una U2b** | factible sin tocar protegidos; los 9 ganchos de evento están inventariados en §5.2 y no dependen del alcance elegido |
| **C** | **¿Cooldown además del candado?** | el candado solo acota a ~3,0s entre envíos; **con la X el mínimo se desploma** al tiempo de interacción (abrir ⋮ → 💬 → frase → X). Si preocupa el spam, el cooldown es lo que lo cierra — y es cheap: mismo `useRef` de timer |
| **D** | **z de las burbujas: 25 (bajo el menú) o 40 (sobre todo)** | ambas medidas y viables; 25 no le tapa al humano la superficie que está tocando |
| **E** | **¿El selector abre sobre el panel o a su lado?** | sobre el panel = las cifras de §3.3; al lado = 70px a la izquierda, **cabe con ≥393,8px de margen** en la peor celda |
