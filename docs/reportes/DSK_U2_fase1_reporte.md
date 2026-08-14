# DSK-U2 · Mensajes funcional — Fase 1: diagnóstico de solo lectura

**Base de código:** HEAD `b1d9359`. **Fecha:** 2026-08-06.
**Naturaleza:** solo lectura. Ensayos aplicados y revertidos **en página**; cero escritura en `src/`.
**Sondas:** `scripts/_u2probe.mjs` (Δ de supresión, 20 celdas + 10 de mesa nativa),
`scripts/_u2echo.mjs` (eco por asiento, 20 celdas), `scripts/_u2fams.mjs` (familias vivas
auto-jugadas). Salidas en `capturas-dsk/_u2*.json`.
**Documento rector:** `docs/AJILEI_Menu_Utilidades_v1.1.md` §2, §9c, §9d, §9e, §10.

---

## 0. Corrección de premisa — cuáles son las dos rutas

El encargo nombra «mesas 5/4/3 (OpponentPanel) y mesa 2 (`.ai-zone`)» como las dos rutas de
render **del mensaje**. Medido: esa bifurcación es la del **rival**, no la del mensaje.

En el gate de escritorio hay **un solo nodo de mensaje** en las cuatro mesas —
`.center-zone .game-message` — verificado en las 20 celdas (`nMsgNodes = 1`). `.two-ovals` /
`.oval-right` pertenecen al branch **landscape móvil** (`isLandscapeTable`, `max-height:600`) y
no montan aquí; mesa 2 de escritorio cae en la rama `aliveN===2 && !isLandscapeTable`, que
monta `renderTwoPlayerRival()` **y** `renderCenterZone()` ([GameTable.jsx:1276-1281](../src/components/GameTable.jsx#L1276-L1281)).

Las dos rutas reales son otras, y son **dos por superficie**:

| Superficie | Ruta A | Ruta B |
|---|---|---|
| **Óvalo** (`.game-message`) | mesas **5 y 4** → `.center-zone` en **grid 2×2** ([gameTable.css:948-982](../src/styles/gameTable.css#L948-L982)) | mesas **3 y 2** → `.center-zone` en **flex row** (regla base) |
| **Eco por asiento** (`.opp-status`) | mesas **5/4/3** → `OpponentPanel` ([OpponentPanel.jsx:125-129](../src/components/OpponentPanel.jsx#L125-L129)) | mesa **2** → vía legacy `.ai-zone` ([GameTable.jsx:1054-1064](../src/components/GameTable.jsx#L1054-L1064)) |

Ambas parejas se miden en §2. La ruta que el toggle debe gobernar es la del **óvalo**; la del
**eco** es una decisión de coherencia que este diagnóstico abre en §2.4.

---

## 1. Censo de las 15 familias a HEAD

Clasificación según el apéndice §9c: **IMP** = exige o habilita una decisión del humano, o
comunica un resultado o una eliminación. **NAR** = crónica de acciones ajenas que no cambia lo
que el humano debe hacer.

Celdas idénticas colapsadas hacia abajo (`〃`).

| # | Familia | Emisión | Clas. | Fase en el punto de emisión | Emisor en el punto de emisión |
|---|---|---|---|---|---|
| 1 | bienvenida | [gameEngine.js:85](../src/engine/gameEngine.js#L85) | IMP* | `WAITING` (literal en la factoría) | sistema (no hay `player`) |
| 2 | reparto | [gameEngine.js:450](../src/engine/gameEngine.js#L450) · [:230](../src/engine/gameEngine.js#L230) | IMP* | `DEAL_2` / `DEAL_3` (se escriben en el mismo objeto) | sistema |
| 3 | apertura | [gameEngine.js:460-461](../src/engine/gameEngine.js#L460-L461) · [:466-467](../src/engine/gameEngine.js#L466-L467) | **partida** | `BET_1` / `BET_2` | `state.manoIndex` → humano si `===0` |
| 4 | apuesta | [gameEngine.js:319](../src/engine/gameEngine.js#L319) · [:328](../src/engine/gameEngine.js#L328) | NAR (IA) | `state.phase` ∈ `BET_1/2/3` | `playerIndex` + `player.isHuman` |
| 5 | igualar | [:320](../src/engine/gameEngine.js#L320) · [:329](../src/engine/gameEngine.js#L329) | NAR §9d | 〃 | 〃 |
| 6 | subir | [:321](../src/engine/gameEngine.js#L321) · [:330](../src/engine/gameEngine.js#L330) | NAR (IA) | 〃 | 〃 |
| 7 | pasar | [:318](../src/engine/gameEngine.js#L318) · [:327](../src/engine/gameEngine.js#L327) | NAR (IA) | 〃 | 〃 |
| 8 | retirarse | [:322](../src/engine/gameEngine.js#L322) · [:331](../src/engine/gameEngine.js#L331) | NAR §9d | 〃 | 〃 |
| 9 | descarte-sel | [gameEngine.js:237](../src/engine/gameEngine.js#L237) | IMP | `DISCARD` | sistema (instrucción al humano) |
| 10 | descarte-narra | [GameTable.jsx:175-180](../src/components/GameTable.jsx#L175-L180), set en [:624](../src/components/GameTable.jsx#L624) | NAR (IA) | `DISCARD` (estado de UI, no del motor) | **`seat` explícito en la firma** |
| 11 | descarte-fin | [gameEngine.js:520](../src/engine/gameEngine.js#L520) · [:522](../src/engine/gameEngine.js#L522) | **partida** | `BET_3` (se escribe en el mismo objeto) | `manoIndex` + `numPlayers` |
| 12 | resultado | [:186](../src/engine/gameEngine.js#L186) · [:188](../src/engine/gameEngine.js#L188) · [:197](../src/engine/gameEngine.js#L197) | IMP | `PAYOUT` (vía `resolveWinner`) | sistema; `winner` disponible |
| 13 | resultado-ajilei | [:178](../src/engine/gameEngine.js#L178) · [:180](../src/engine/gameEngine.js#L180) · [:182](../src/engine/gameEngine.js#L182) · [:193](../src/engine/gameEngine.js#L193) | IMP | 〃 | 〃 |
| 14 | resultado-empate | [:185](../src/engine/gameEngine.js#L185) · [:195](../src/engine/gameEngine.js#L195) | IMP | 〃 | 〃 |
| 15 | retiros | [:342](../src/engine/gameEngine.js#L342) · [:344](../src/engine/gameEngine.js#L344) · [:347-348](../src/engine/gameEngine.js#L347-L348) | IMP §9d | `PAYOUT` (vía `resolveWinner`) | `survivor.isHuman` |

\* Ver §1.3: ninguna de las dos cae bajo «crónica de acciones **ajenas**», así que por la letra
de §9c quedan fuera de NAR. Es una consecuencia del texto, no una elección de este diagnóstico.

**No es familia:** el vaciado `message: ''` de «Siguiente mano»
([GameTable.jsx:1473](../src/components/GameTable.jsx#L1473)) — limpieza, no mensaje.

**Contraste vivo.** `_u2fams.mjs` auto-jugó 4 manos en mesa 5 y 4 en mesa 2 (48 y 27 estados
distintos): aparecieron 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 y 14. **No** aparecieron 13
(`resultado-ajilei`), 15 (`retiros`) ni los tres emisores externos — hay que **construirlos**,
no esperarlos (consecuencia directa para §5).

### 1.1 Las cuatro dudosas — verificación contra el código real

| Familia | Resolución §9d | ¿Mapea limpio? | Evidencia en código / medida |
|---|---|---|---|
| **apertura** | partida por emisor | **Sí** | El molde N=2 **sí** separa: `'A las 2 — Tu turno.'` vs `'A las 2 — IA pensando...'` ([:460](../src/engine/gameEngine.js#L460)). El molde N>2 **no**: es la misma plantilla `` `A las 2 — ${name} abre.` `` para los dos, y el nombre del humano es `'Tú'` → observado en vivo: **«A las 2 — Tú abre.»** junto a «A las 2 — IA 1 abre.». Sólo `manoIndex` los separa. |
| **descarte-fin** | partida por emisor | **Sí** | `turnHint = manoIndex === 0 ? 'Tu turno.' : 'IA pensando...'` ([:519](../src/engine/gameEngine.js#L519)). Observadas las dos variantes en vivo. La rama N>2 (`'Descarte completado. Al descarte.'`) es única → NAR. |
| **igualar** | NAR — la cifra vive en `.call-box` | **Sí** | `.call-box` es hermano del mensaje dentro de `.center-zone` ([GameTable.jsx:1170-1173](../src/components/GameTable.jsx#L1170-L1173)) y su visibilidad la gobierna `currentBet > 0 && isBetPhase`, no el texto. El toggle no puede alcanzarla. |
| **retirarse** | NAR; el cierre de mano lo comunica la familia 15 | **Sí, y con un refuerzo que el doc no registra** | En **N=2** las cadenas de la familia 8 y de la 15 son **byte-idénticas** (`:322` vs `:342-344`), y como un fold en mesa 2 siempre deja un solo activo, la rama `:322` **jamás alcanza el óvalo**: todo retiro de mesa 2 es familia 15 → IMP. Un regex sería **incapaz** de separarlas; `phase → PAYOUT` las separa sin ambigüedad. |

### 1.2 Los tres emisores externos — §9e

| Emisor | Nodo | ¿Fuera del alcance del toggle? |
|---|---|---|
| `.elim-notice` | [GameTable.jsx:888](../src/components/GameTable.jsx#L888) → `.elim-notice-inline` [:1197](../src/components/GameTable.jsx#L1197) | **Sí, estructuralmente.** Vive en estado propio (`elimNotice`) y, mientras está activo, **desmonta todo el contenido del óvalo, `.game-message` incluido** ([:1160](../src/components/GameTable.jsx#L1160)). El toggle no tiene nada que tocar. |
| `.comodin-note` | [GameTable.jsx:354-356](../src/components/GameTable.jsx#L354-L356) → [:1183-1188](../src/components/GameTable.jsx#L1183-L1188) | **Sí.** Nodo hermano, gateado por `numPlayers >= 4`, sin relación con `game.message`. |
| **GAME_OVER** | [gameEngine.js:391-405](../src/engine/gameEngine.js#L391-L405) → `.game-over-msg` [GameTable.jsx:1264](../src/components/GameTable.jsx#L1264) | **Sí.** Es `game.message`, pero se pinta en la **pantalla terminal**, que reemplaza el tablero entero: `.center-zone` ni existe en ese render. |

Los tres mapean limpio.

### 1.3 Lo que NO mapea limpio — dos casos, ninguno bloqueante

**No hay STOP**: en las 15 familias, fase y emisor están disponibles sin inferir del texto (§1.4
detalla dónde). Pero hay dos vacíos que la clasificación de §9c no cubre y que son **decisión de
Victor**, no del implementador:

**(A) La binaria no nombra al emisor sistema ni al emisor humano.**
§9c define NAR como «la crónica de acciones **ajenas**». Quedan sin casilla:
- **el sistema** — familias 1 (`bienvenida`) y 2 (`reparto`): no exigen decisión, no comunican
  resultado, y no son ajenas. Por la letra caen en IMP, o sea que **«Repartiendo...» sobrevive
  al toggle**.
- **el propio humano** — el eco de la acción que acabas de ejecutar: `'Pasas.'`,
  `'Apuestas 10000 fichas.'`, `'Igualas a 200.'`, `'Subes a 500.'`, `'No descartas.'`,
  `'Descartas 3 cartas.'` Y en N>2, con el nombre `'Tú'`, la **misma plantilla de tercera
  persona** que las IAs — observado en vivo: **«Tú pasa.»**, **«Tú iguala a 200.»**

  *Recomendación:* NAR (no cambia lo que debes hacer, y ya lo sabes: lo acabas de hacer).
  *Efecto de la alternativa:* si se dejan IMP, con el toggle OFF el óvalo sigue narrando cada
  acción propia y el silencio se siente a medias.

**(B) Watch item ajeno a esta tanda — «Tú pasa.» / «Tú iguala a 200.» / «Tú se retira.»**
La rama N>2 de `applyBetAction` ([gameEngine.js:325-332](../src/engine/gameEngine.js#L325-L332))
conjuga en tercera persona con `player.name`, que para el humano es `'Tú'`. Es un defecto de
redacción **preexistente**, visible hoy en las mesas 5/4/3 y en la 2 por atrición
(`numPlayers` es el tamaño **físico**). Se registra porque afecta a U2 de dos maneras: refuerza
que el emisor **no** vive en el texto, y arreglarlo exigiría tocar el motor.

### 1.4 Dónde puede etiquetarse sin tocar el motor ni leer el texto

El apéndice §9c afirma que «la UI ya conoce la fase y el emisor de cada mensaje». **Verificado y
matizado:** la UI lo conoce en el **punto de despacho**, no en el punto de render. `game.message`
llega al render como cadena plana; la señal estable está en el par `(prev, next)` de cada
`setGame`, exactamente como el precedente vivo `inferAction`
([GameTable.jsx:133-145](../src/components/GameTable.jsx#L133-L145)) ya deduce la acción de una
transición de estado.

Hay **11 sitios `setGame`**; 10 mutan el mensaje (`toggleDiscard` en [:983](../src/components/GameTable.jsx#L983) no):

| Sitio | Familias que puede producir | Emisor disponible ahí |
|---|---|---|
| [:426](../src/components/GameTable.jsx#L426) `advanceFromDeal` (DEAL_2) | 3 apertura | `next.manoIndex` |
| [:420](../src/components/GameTable.jsx#L420) `advanceFromDeal` (DEAL_3) | 〃 | 〃 |
| [:554](../src/components/GameTable.jsx#L554) `act(action)` | 4-8 (**acción literal en la firma**) o cierre de ronda | humano, `seat 0` |
| [:467](../src/components/GameTable.jsx#L467) timeout del humano | 7/8 o cierre de ronda | 〃 |
| [:508](../src/components/GameTable.jsx#L508) acción de IA | 4-8 o cierre de ronda | `seat` (**ya lo captura** para `lastActions`) |
| [:527](../src/components/GameTable.jsx#L527) salto de retirado | 〃 | `prev.activePlayerIndex` |
| [:637](../src/components/GameTable.jsx#L637) commit de `applyDiscard` | 11 descarte-fin | `nextGame.manoIndex`, `numPlayers` |
| [:910](../src/components/GameTable.jsx#L910) `commitNewHand` | 2 reparto | sistema |
| [:868](../src/components/GameTable.jsx#L868) `startHand`→GAME_OVER | fuera del óvalo | — |
| [:1473](../src/components/GameTable.jsx#L1473) limpieza | `''` | — |
| [:624](../src/components/GameTable.jsx#L624) `setDiscardMsg` | 10 descarte-narra | **`seat` explícito** |

El único punto delicado es el **cierre de ronda**: un solo `act('igualar')` puede devolver, en
vez de «Igualas a 200», el mensaje de `advanceBettingPhase` o de `doShowdown`
([gameEngine.js:358](../src/engine/gameEngine.js#L358)). Se desambigua con la transición, sin regex:

| `prev.phase → next.phase` | Familia |
|---|---|
| `BET_1 → DEAL_3` | 2 reparto |
| `BET_2 → DISCARD` | 9 descarte-sel |
| `* → PAYOUT` con `players[winner].score` | 12/13/14 resultado |
| `* → PAYOUT` sin `score` | 15 retiros |
| fase sin cambio | la acción despachada/inferida, emisor = el asiento que actuó |

**Principio a prueba de fallos que se propone sellar:** *un mensaje sin etiqueta es
imprescindible.* Si mañana alguien añade un `setGame` y olvida etiquetar, el mensaje se **ve**;
jamás se pierde información de juego por un descuido.

**Decisión abierta (C):** §3.3 del rector declara «Sin tocar `gameEngine.js` (restricción general
del sistema de diseño)». En el punto de emisión del motor, fase y emisor están **a mano y son
exactos** (`playerIndex`, `player.isHuman`, `manoIndex`, la fase que se escribe en el mismo
objeto): un campo **aditivo** `msgTag: { fam, emisor }` junto a `message` sería más corto y más
robusto que reconstruirlo en 10 sitios de la UI. La vía UI es **viable y suficiente** —por eso no
hay STOP—, pero cuesta más y es más fácil de romper. Es decisión de Victor cuál se paga.

---

## 2. Rendering y el Δ de suprimir

### 2.1 Anatomía de las dos rutas del óvalo (tokens vivos, 1366×768)

| | Mesas 5 y 4 | Mesas 3 y 2 |
|---|---|---|
| `.center-zone` `display` | **grid** | **flex** row, `nowrap` |
| pistas | `133,203px` + gap `18` + `324,766px` (= caja de contenido, `475,969`) | — |
| sitio del mensaje | `grid-column: 2 / row 1`; `.comodin-note` justo debajo | ítem flex entre `.call-box` y `.comodin-note` |
| ancho del mensaje | el de su pista | `flex: 1 1 0%` + `min-width: 0` (guardia O2) |
| alto del mensaje | `54px` **fijo** (regla base; el bloque DSK no la toca) | 〃 |
| ancho del óvalo | `min(486px, 100%−ml−mr)`, border-box | m3 igual; **m2 sin canaletas** (ancho completo) |
| alto del óvalo | `flex: 1 1 0%` — se lo da el sobrante, no el contenido | 〃 |
| `overflow` | `hidden` ([:961](../src/styles/gameTable.css#L961)) | `hidden` (guardia O2, [:5340](../src/styles/gameTable.css#L5340)) |

### 2.2 Δ medido — 20 celdas × 15 familias × 3 estrategias

Estrategias: **`dom`** = se desmonta el `<p>` (JSX condicional) · **`blank`** = `textContent = ''`
(`centerMsg` vacío) · **`vis`** = `visibility: hidden` conservando el texto (doctrina O1).
Anclas medidas: óvalo, pozo, `pot-value`, `A igualar`, comodín, `rivals-zone`, `table-mid`,
columnas laterales, `ai-zone`, área humana, barra, `cards-row`, `.game-table`, «Tu mejor palo»,
más overflow del scroller.

| Mesa | Viewports | `dom` | `blank` | `vis` |
|---|---|---|---|---|
| **5** | los 5 | **0** | **0** | **0** |
| **4** | 〃 | **0** | **0** | **0** |
| **3** (reducida, con comodín) | 1024·1280·1366 | **104,20** | **0** | **0** |
| 〃 | 1440 | 100,20 | 0 | 0 |
| 〃 | 1920 | 91,95 | 0 | 0 |
| **3** (nativa, sin comodín) | 1024·1280·1366 | **189,19** | **0** | **0** |
| 〃 | 1440 | 185,19 | 0 | 0 |
| 〃 | 1920 | 176,94 | 0 | 0 |
| **2** (reducida) | los 5 | **166,00** | **0** | **0** |
| **2** (nativa) | los 5 | **250,99** | **0** | **0** |

**El óvalo nunca se mueve** en ninguna celda ni estrategia: su ancho es explícito (5/4/3) o
completo (2) y su alto es `flex:1`. Lo que se desplaza con `dom` es **el interior**, y sólo en
horizontal: pozo y «A igualar» **a la derecha**, comodín **a la izquierda**, `dy = dw = dh = 0`.

**La magnitud sale de un token vivo, no de una constante:**

> **Δ = (ancho usado del mensaje + `column-gap`) / 2**

Verificado en las cuatro combinaciones: m3 reducida `(190,39 + 18)/2 = 104,195` ✓ ·
m3 nativa `(360,39 + 18)/2 = 189,195` ✓ · m2 reducida `(313,98 + 18)/2 = 165,99` ✓ ·
m2 nativa `(483,98 + 18)/2 = 250,99` ✓.

### 2.3 Por qué 5/4 salen gratis y 3/2 también, salvo con `dom`

- **Mesas 5/4 (grid).** La columna 2 es `minmax(0, 360px)` dentro de un óvalo de **ancho
  definido**. Su pista se sirve del **sobrante**, no del contenido: medida `324,766px` idéntica
  con el mensaje en su sitio, vaciado, oculto **y desmontado**. La columna 1 es el `max-content`
  del pozo, invariante. **El mensaje nunca ha dimensionado su pista** → Δ=0 por construcción, con
  cualquier estrategia. (Esto contradice la intuición de que el grid sería el caso frágil: es el
  robusto.)
- **Mesas 3/2 (flex).** `.game-message` es `flex: 1 1 0%` con `min-width: 0`: su ancho usado es
  el sobrante y es **independiente del texto** — medido constante en las 15 familias (190,39 en
  m3; 313,98 en m2). Mientras la **caja** siga en la fila, `blank` y `vis` dan Δ=0. `dom` retira
  la caja y `justify-content: center` recentra a los supervivientes.

**Conclusión operativa:** la expectativa de diseño (Δ=0 con el toggle en OFF) **se cumple gratis
en las cuatro mesas** siempre que la supresión **conserve el nodo**. No cuesta CSS nuevo, no
cuesta una reserva explícita como la que U1 tuvo que pagar en la caja del ⋮. Lo único prohibido
es el JSX condicional, y su precio está tarifado arriba (hasta **250,99px** en mesa 2 nativa).

Entre las dos formas que sí valen, **`vis` es la que manda la doctrina** —§6 del rector:
«ocultamiento por `visibility`/`opacity`»— y además es la única inmune a un cambio futuro de
layout: si algún día el óvalo dejara de ser ancho-definido, `visibility` seguiría reservando la
caja **con su tamaño intrínseco**, mientras que `blank` colapsaría a cero.

**Sub-decisión pendiente (D): qué se ve en el hueco.** Con `discardMsg` la supresión puede ser
por **vaciado** (el renglón queda en blanco) o por **sustitución** (no se escribe `discardMsg` y
el óvalo conserva el último imprescindible — que durante el descarte sería «Selecciona hasta N
cartas a descartar.», ya obsoleto). Se recomienda **vaciado**; conviene decidirlo antes de
implementar porque cambia el `centerMsg` de [GameTable.jsx:1147](../src/components/GameTable.jsx#L1147).

### 2.4 El eco por asiento (`.opp-status`) — las otras dos rutas

Medido en las 20 celdas con los 7 textos reales (`Pensando…`, `Apostó`, `Igualó`, `Subió`,
`Pasó`, `Descartó 3`, `Se retiró`):

| Ruta | Mesas | `position` | `dom` | `blank` | `vis` |
|---|---|---|---|---|---|
| `OpponentPanel` | 5 / 4 / 3 | `absolute` | **0** | **0** | **0** |
| `.ai-zone` (legacy) | 2 | `absolute` | **0** | **0** | **0** |

Está **fuera de flujo en las dos rutas** → Δ=0 con cualquier estrategia, incluido el desmontaje.
Silenciarlo sería gratis.

**Pero está fuera del alcance textual del rector**, que habla de «los mensajes narrativos **del
centro de mesa**». Queda como **decisión (E)**: con el toggle en OFF el óvalo calla, pero cada
panel sigue anunciando «Igualó», «Subió», «Se retiró». O es coherencia deseada (la mesa entera
enmudece) o es alcance nuevo. El coste técnico es cero; la pregunta es de producto.

---

## 3. Plomería de estado — el molde del Sonido

El precedente de §9f está **verificado y es replicable tal cual**
([SoundContext.jsx](../src/context/SoundContext.jsx)):

| Pieza | Sonido (hoy) | Mensajes (propuesta) |
|---|---|---|
| Contexto | `SoundProvider` colgado de la raíz en `main.jsx` | mismo patrón; se recomienda **un solo `PreferencesProvider`** en vez de un contexto por ajuste — Saldo llega después y serían tres |
| Clave | `ajilei.sound` | **`ajilei.mensajes`** |
| Valores | `'on'` / `'off'`; **cualquier lectura distinta de `'off'` es ON** | idéntico |
| Default | ON ante ausencia de clave **y ante storage denegado** (`catch { return true }`) | idéntico → **default ON** |
| Escritura | efecto único que persiste **y** aplica, «para que jamás diverjan» | idéntico (sin `Howler`: aquí no hay motor que silenciar) |
| Momento de creación | al inicializar el contexto (arranque de la app) | ver nota ↓ |

**Nota sobre el momento de creación.** El Sonido crea su clave al arrancar; el contador de
consultas la crea **al montar el panel por primera vez** (§10c), para que móvil no estrene una
clave que nunca leerá. Mensajes tiene el mismo dilema y **la respuesta contraria**: como el
default es ON y el efecto es visual en la mesa, no hace falta crear la clave hasta la primera
conmutación. **Propuesta: leer siempre, escribir sólo al conmutar** — móvil no estrena clave, y
tampoco la necesita.

**Móvil.** Confirmado: sin menú, sin conmutador y con default ON, el estado efectivo en móvil es
«narrativas visibles» = comportamiento de hoy → **cambio observable nulo**. Si algún día el menú
llega al teléfono, hereda el ajuste ya persistido — la misma mejora autorizada en §9f, y por la
misma razón. El sellado móvil de esta tanda vuelve a ser **visual**: ni una regla CSS ni un nodo
del árbol móvil cambian.

**Verificado, sin colisión:** las claves vivas son exactamente `ajilei.sound`
([SoundContext.jsx:15](../src/context/SoundContext.jsx#L15)) y `ajilei.consultas`
([useUtilitiesMenu.js:26](../src/hooks/useUtilitiesMenu.js#L26)).

---

## 4. Qué falta para habilitar la entrada

Hoy «Mensajes» vive en el array `INERTES`
([UtilitiesMenu.jsx:68-73](../src/components/UtilitiesMenu.jsx#L68-L73)), renderizada como
`<button className="util-item is-disabled" disabled title="Mensajes">💬</button>`.

| Pieza | Estado a HEAD | Qué falta |
|---|---|---|
| **Glifo ON** | `💬` — ya elegido y ubicado (§10a) | nada |
| **Glifo OFF** | **no existe** | decisión. `🔊/🔇` fue un par natural; `💬` no lo tiene. Ver ↓ |
| **Gancho CSS de estado** | **`is-off` NO tiene ninguna regla en todo `src/`** — sólo se aplica en JSX ([UtilitiesMenu.jsx:136](../src/components/UtilitiesMenu.jsx#L136)) | **crear la regla**. Es deuda heredada de U1: §9f prometió «glifo **y** clase» y la clase quedó muda |
| **Tooltip** | `title="Mensajes"` nativo, estático — igual que Sonido | funciona; conviene decidir si refleja estado (`"Mensajes: activos"` / `"Mensajes: silenciados"`) o se queda estático como su hermano |
| **Salida de `INERTES`** | pendiente | pasar a `<button>` vivo con `onClick={() => { toggle(); onClose() }}`, molde exacto del Sonido ([:133-141](../src/components/UtilitiesMenu.jsx#L133-L141)) |
| **Área táctil** | ya conforme: fila 44px de alto × 62 de interior (§10a) | nada |

**Cierre al ejecutar: confirmado.** §1.3.1 lo manda para los toggles y el Sonido lo implementa
así (`onClick={() => { toggleSound(); onClose() }}`). Mensajes debe copiarlo literalmente.
El listener de clic-fuera ya ignora todo lo que caiga dentro de `.utilities-panel`
([useUtilitiesMenu.js:87](../src/hooks/useUtilitiesMenu.js#L87)), así que no hay interferencia
con el invariante del badge.

**Decisión (F) — cómo se ve el OFF.** Tres candidatas, en orden de preferencia:
1. **`💬` fijo + regla `is-off` compartida** (atenuación + tachado fino en `::after`), que de paso
   **le da cuerpo al gancho que el Sonido ya declara y nadie estiliza**. Una sola regla sirve a
   las dos entradas y a la de Saldo cuando llegue.
2. `💬` / `🔕` — par de emoji, pero mezcla semántica (campana vs bocadillo).
3. Sólo `title` — descartada: repite el error que §9f quiso corregir.

Sea cual sea, **no puede reutilizarse la atenuación de `.is-disabled` (`opacity: .45`)**: ese es
el lenguaje de «no habilitado», y un toggle apagado sí está habilitado.

---

## 5. Bosquejo del modo `u2` del arnés

**Modo nuevo, no extensión de `u1`.** `u1` valida el **contenedor** (apertura, apilamiento,
Δ=0 de la caja del ⋮, guardia de contenido, persistencia del sonido); `u2` valida el **efecto en
la mesa**. Mezclarlos haría que una regresión de mensajes se leyera como una del menú.

**Matriz:** 4 mesas × 5 viewports = **20 celdas** (los 4 de campaña + centinela **1440×850** —
la banda 801..900 donde `--card-w` cambia de tier; en §2.2 esa fila **ya se separó del resto** en
mesa 3, prueba de que sigue ganándose el sitio).

**Requisito previo para el implementador — la puerta 1 no puede leer texto.** Para que el arnés
verifique la **clasificación** sin regex (el pecado que §9c prohíbe), la implementación debe
**exponer la etiqueta en el DOM**: `data-msg-fam` y `data-msg-emisor` en `.game-message`. Sin eso
el arnés sólo podría comprobar el layout, y la mitad del contrato quedaría sin puerta.

**Dos sub-pasadas, por lo que §1 midió en vivo:**

- **A · Jugada** — auto-juego de 4 manos por celda, con el molde de `_u2fams.mjs`: **un clic por
  iteración y rechequeo de fase antes del siguiente** (lección W1; el muestreador la aplicó y
  recorrió 48 estados en mesa 5 sin desincronizarse). Cubre las 13 familias alcanzables.
- **B · Construida** — inyección con marca `[data-u2]`, molde `O2`, para las que el auto-juego no
  alcanza: `resultado-ajilei`, `retiros`, `.elim-notice`, GAME_OVER, y el peor caso de ancho
  (pozo 25000 + «A igualar» visible + comodín inyectado en 3/2, porque una mesa **reducida** sí lo
  lleva).

**Las seis puertas:**

| # | Puerta | Expectativa — **derivada de tokens vivos** |
|---|---|---|
| 1 | **Narrativa ausente** | con OFF, toda `.game-message[data-msg-fam]` clasificada NAR tiene `visibility: hidden` (leído de `getComputedStyle`, no del atributo `style`) |
| 2 | **Imprescindible presente** | con OFF, ninguna IMP se oculta; y las **familias partidas** se comprueban **por asiento**: apertura y descarte-fin con `manoIndex === 0` deben verse, con `manoIndex !== 0` no |
| 3 | **Δ=0 de layout** | snapshot ON vs OFF en **las 15 anclas de §2.2**; tolerancia **0,02px** (cuantización 1/64). Segunda comprobación **estructural**: `.game-message` sigue en el DOM y `getComputedStyle().display !== 'none'` — mata la regresión a JSX condicional antes de que el Δ la delate |
| 4 | **Ambas rutas** | las pistas del grid de 5/4 se contrastan contra `getComputedStyle(oval).gridTemplateColumns` (no contra `133,203`/`324,766`); el ancho del mensaje en 3/2 contra el sobrante calculado del óvalo vivo |
| 5 | **Intocables** | `.call-box`, `.comodin-note`, `.elim-notice-inline` y `.game-over-msg` idénticos en texto y caja entre ON y OFF — la garantía material de §9d (igualar) y §9e (los tres externos) |
| 6 | **Persistencia** | apagar → recargar → volver a la mesa → sigue apagado; y `localStorage` **sin la clave** ⇒ narrativas visibles (default ON). Sub-pasada móvil (390×844 y 844×390): árbol y CSS byte a byte contra HEAD |

**Anti-cableado.** Ningún número literal en las expectativas: Δ se deriva de
`(anchoUsadoDelMensaje + columnGap)/2` leído en vivo (fórmula ya validada en las cuatro
combinaciones de §2.2), las pistas del grid de la propia caja, y la matriz de familias del
`data-msg-fam` que emite la app — no de una lista paralela en el arnés, que se desincronizaría al
primer cambio de redacción.

---

## STOP

Diagnóstico cerrado. **No hay bloqueo técnico**: las 15 familias son clasificables por fase +
emisor sin tocar el motor y sin un solo regex, y el Δ=0 con el toggle en OFF **sale gratis en las
cuatro mesas** con tal de conservar el nodo del mensaje.

Quedan **seis decisiones** para Victor y Claude antes de implementar:

| | Decisión | Recomendación |
|---|---|---|
| **A** | ¿El emisor **sistema** (bienvenida, reparto) y el emisor **humano** (tu propio eco) son NAR o IMP? La binaria de §9c no los nombra | sistema → IMP · humano → **NAR** |
| **B** | «Tú pasa.» / «Tú iguala a 200.» — defecto de redacción preexistente en N>2 | **watch item**; arreglarlo toca el motor |
| **C** | ¿Etiquetar en la UI (10 sitios `setGame`, más trabajo, más frágil) o un campo **aditivo** `msgTag` en el motor (más corto, contra la restricción de §3.3)? | preguntar antes de escribir código |
| **D** | Con la narrativa suprimida, ¿renglón **en blanco** o **último imprescindible** en su sitio? | **en blanco** |
| **E** | ¿El toggle alcanza también el **eco por asiento** (`.opp-status`)? Coste técnico **cero** (Δ=0 medido en las dos rutas), pero excede la letra del rector | decisión de producto |
| **F** | Cómo se ve el OFF en el panel, sabiendo que **`is-off` no tiene ninguna regla CSS hoy** | `💬` fijo + regla `is-off` **compartida** con el Sonido, que salda de paso la deuda de §9f |

Se propone además sellar un **principio a prueba de fallos**: *mensaje sin etiqueta = imprescindible.*
