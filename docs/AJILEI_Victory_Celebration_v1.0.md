# AJILEI — Victory Celebration v1.0

**Estado:** Especificación sellada e implementada. **Vigente en v1.1** — este archivo lleva sus
versiones dentro (§10), como ya hacía con v1.0b; no se abre uno nuevo por enmienda.
**Fecha:** 2026-08-08 · **última enmienda 2026-08-21 (v1.1, VIS-3)**.
**Base de código:** HEAD `973e94d` (PWA-M1). Implementado en la tanda **DSK-VC2**, sobre el
diagnóstico read-only **DSK-VC1**. Enmendado en **VIS-3** sobre HEAD `9f7dd13`.
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md`.
**Documentos relacionados:** `AJILEI_Menu_Utilidades_v1.3.md` (moldes de capa, anclaje por tinta,
núcleo puro sellado por Vitest).

---

## 1. Qué se celebra, y qué no

Tres niveles por rareza para victorias del humano, y —desde **VIS-3**— un cuarto que **no es una
celebración**: la recolección. Las derrotas siguen sin subrayarse; lo que cambia es que el dinero
se ve moverse gane quien gane, porque eso es información y no fanfarria.

| Nivel | Cuándo | Qué ocurre |
|---|---|---|
| **Mano ganada** | Fase de pago, gana el asiento 0 | El pozo viaja a tu moneda + un pulso dorado en tu nombre |
| **AJILEI** | Fase de pago, gana el asiento 0 **y** su mano es perfecta | La palabra **AJILEI** en grande + rasgueo. **Sustituye** al nivel anterior |
| **Recolección** *(VIS-3)* | Fase de pago, gana **cualquier otro asiento** | El pozo viaja a la moneda de esa IA + roce de fichas. **Sin overlay, sin pulso, sin fanfarria** |
| **Partida ganada** | Fin de mesa, último con fichas | Dos nudillos secos + tarjeta-resumen |

Las tres banderas de cada nivel las dice `banderasDe(nivel)`, en un solo sitio y compuesta de las
funciones puras que ya existían (`llevaViaje` / `llevaPulso`), de modo que no puede desincronizarse
de ellas:

| Nivel | `vuelo` | `overlay` | `fanfarria` |
|---|---|---|---|
| `mano` | sí | no | sí |
| `ajilei` | sí | sí | sí |
| `recoleccion` | sí | no | **no** |
| `partida` | no | no | no |

### Transversales innegociables

- **≤2,5 s** por celebración **en mesa**. La tarjeta de fin de partida está **exenta**: es
  pantalla terminal, no interrumpe nada.
- **Un toque la corta** — dibujo y sonido de un golpe.
- **Overlays puros**, Δ=0 de layout por construcción.
- **Respeta el mute** del menú de utilidades.
- **El oro sólo donde pertenece**: pulso y AJILEI. Regla single-gold intacta.

---

## 2. El decisor — `decideCelebracion`, puro y sellado

Toda la lógica de *«¿se celebra, y qué?»* vive en **una función pura** (`src/hooks/celebracionCore.js`)
y en ningún otro sitio. Vitest la sella entera. Sus reglas, en el orden exacto en que se aplican:

### 2.1 `winner === 0` — reabierta con contabilidad en VIS-3

**Hasta VIS-3** ésta era la primera guarda y devolvía `null` *sin excepción*: si ganaba una IA no
ocurría absolutamente nada.

**Desde VIS-3** una victoria de IA en fase de pago devuelve **`'recoleccion'`**. La guarda se
reabre porque lo que protegía no era «que no pase nada», sino **que una derrota no se subraye** —
y recolectar no la subraya: sin overlay, sin pulso, sin fanfarria. Lo único que se estrena es que
el dinero se ve irse, que es información sobre la mesa y no una fiesta ajena.

La **primera** guarda pasa a ser `winner === null`, y ahora es *indispensable*: con `winner !== 0`
ya sin caer en `null`, un ganador nulo se leería como «ganó una IA». Tiene prueba propia.

> **BLINDAJE: un AJILEI perdido NO celebra. Intacto, y por la misma razón.**
> Ocurre de verdad. Con dos AJILEI en mesa, el desempate lo gana el más cercano a la Mano: el
> humano puede tener **mano perfecta y perder**. Mano perfecta y derrota siguen siendo derrota.
> El caso se resuelve **antes de mirar las cartas**, así que jamás llega a `'ajilei'`: cae en
> `'recoleccion'`, cuyas banderas son `overlay: false, fanfarria: false`.
> Sigue teniendo prueba propia en Vitest y puerta propia en el arnés. VIS-3 lo midió además **en
> vivo**, con el caso real en pantalla — *«¡AJILEI! IA 1 gana con mano perfecta (comodín)»* — y
> `overlay = false`, `pulso = false`.

### 2.2 AJILEI por recálculo, jamás leído del estado ni del mensaje

La bandera `ajilei` que `doShowdown` calcula **muere en su variable local**: `newPlayers` sólo
arrastra `score`. Se recalcula con `isAjilei` —exportada y pura— contra el **`ruleN` congelado**
del snapshot de la mano (`game.handRules`), nunca un recuento vivo. `gameEngine.js` no se toca.

**Se aceptan las DOS variantes** que el motor reconoce:

- **Natural** — cinco cartas del mismo palo sumando **51**.
- **De comodín** — **sólo mesa 5**: cuatro del palo + 7 de Oros, con 41 + 11 = **52**.

La misma mano de comodín en mesa 4 **no** es AJILEI, y hay prueba que lo fija.

### 2.3 Jerarquía: AJILEI sustituye a mano, nunca encadenan

**"Partida" no colisiona con nada**, y eso está verificado contra la secuencia real: la victoria
de mesa no se resuelve en el pago sino en `beginHand()`, o sea **después de que el usuario pulse
"Siguiente mano"**. Siempre hay un clic humano en medio; y si además cayó una IA, la ceremonia de
eliminación mete otros 4,75 s. La jerarquía de tres se reduce en la práctica a **una de dos**.

---

## 3. Mano ganada y AJILEI

### 3.0 La secuencia — el viaje va DETRÁS del sonido del ganador (VC2b)

La celebración de mesa tiene **dos tiempos**, no uno:

| | Qué suena | Qué se dibuja |
|---|---|---|
| **Primer tiempo** | `showdown.mp3` — el sonido del volteo, que suena gane quien gane | nada todavía |
| **Segundo tiempo** | el sonido del nivel (`chips-collect` o `ajilei-strum`) | el viaje del pozo, con su pulso |

El segundo arranca en el **`end`** del primero, que Howler emite **por id** — el mismo id que
`play()` ya devolvía desde VC2 para que el toque pudiera cortar el audio. Antes arrancaban en
paralelo y las dos capas se embarraban.

**La guardia es obligatoria, no un adorno defensivo:** el `end` de un sonido que nunca empezó no
puede ser la condición de un visual. Cuando no hay a qué esperar, el viaje sale **de inmediato**:

- **manos ganadas por retiros** — no hubo comparación, no hubo volteo, no suena nada;
- **con el mute puesto** — `play()` devuelve `null`, y ése es el único aviso que hace falta.

La decisión vive en `esperaPrecedente(audio)`, pura y sellada por Vitest: devuelve **0** = «arranca
ya», o los ms de una **red de seguridad**. La red **no es el reloj** — manda el `end`; sólo cubre
que el evento no llegue nunca (un archivo que no carga, un `stop` externo), y está **acotada** a
3000 ms para que un audio largo no deje la celebración colgada.

`showdown.mp3` mide **2,088 s** de archivo con **1,77 s útiles**: el `end` llega ~0,32 s después
del último sonido audible. Es la cola de silencio del archivo, no un retardo de diseño; si algún
día molesta, la cortina de `cardShuffle` la recorta sin tocar el fichero.

> **El techo de 2,5 s mide el DIBUJO, no la espera.** El reloj de la celebración empieza en su
> arranque. Que espera + celebración sumen más de 2,5 s es lo esperado y no infringe nada — pero el
> arnés hubo que corregirlo: medir desde el pago daba un falso rojo al principio y un falso verde
> al final.

`activa` nace con `esperando: true` — ya decidida y ya medida, todavía callada. **Un solo estado
para los dos tiempos, a propósito:** así el toque que corta, el corte por `resize` y la guardia de
id que ya existían cubren la espera sin una línea nueva, y la secuencia entera se corta desde
cualquier punto (ver §6).

**El orden de los hooks en `GameTable` es portante:** el efecto que dispara `showdown` es hermano
**anterior** al de `useCelebracion`, porque React vacía los efectos en orden de declaración. Al
revés, la celebración leería el asa de la mano anterior.

### 3.1 El viaje del pozo

**El pozo ya es 0 cuando la fase de pago pinta**: `resolveWinner` lo vacía y suma las fichas al
ganador antes de renderizar. El viaje es **decorativo**, así que su magnitud se captura **antes**,
con el molde `prevPotRef` (el mismo patrón del "+N" del pozo, aquí guardando el último valor no
nulo). El reguero crece con el pozo, acotado a **3–7 fichas** para que la duración no se dispare:
siete fichas son 1640 ms, holgadamente bajo el techo.

Molde **`FlyingCard` entero**: se pinta en el origen, un `requestAnimationFrame` después se aplica
el desplazamiento y la transición hace el resto.

> **Hallazgo de VC1 que fijaba el destino en v1:** `.corner-chip` **no existe** en la zona del
> humano en ninguna de las 20 celdas. El destino era la pila de la barra, `.pbr-chips`.

---

### 3.1b Vuelo v2 — de moneda a moneda (VIS-3, 2026-08-21)

El vuelo iba de **caja a caja**: salía del centro de `.pot-box` —el óvalo— y aterrizaba en el
centro de `.pbr-chips` —la frase «N fichas»—, así que nunca tocaba una moneda. Ahora va de la
**Heptacoin del pozo** a la **Heptacoin del ganador**. Siete decisiones, selladas por Victor:

1. **Origen y destino son monedas, no cajas.** `[data-coin-source="pot"] .chip-token` →
   `[data-coin-target="<índice>"] .chip-token`.
2. **El destino se resuelve por identificador estable**, nunca por clase de posición ni por orden
   DOM. `data-coin-target` lleva el **índice del motor**, el mismo que devuelve `game.winner`.
   El atributo vive en cinco sitios: `.pbr-chips` (siempre `"0"`), las dos `.opp-corner-chip`
   (panel y vía legacy `.ai-zone`) y los dos saldos inline. El origen, en las **dos** `.pot-box`
   —`renderCenterZone` y `renderTwoOvalsZone`—, que nunca coexisten.
3. **Siete monedas siempre** (`VIAJE_N = 7`; 7 = hepta). Sustituye a la fórmula que las contaba
   según el tamaño del pozo: el reguero era una lectura del bote y pasa a ser una firma de la casa.
   1640 ms, bajo el techo de 2,5 s.
4. **Micro-ajuste de escala al llegar.** Cada moneda vuela a su tamaño durante la primera mitad
   del trayecto y termina en `lado del destino / lado propio`. La escala **se mide**: humano ×1,5
   (36/24), IA ×0,667 (16/24). Escribirla sería falso — en mesa 5 a 1024×600 la moneda del pozo
   mide **11 px** porque el CSS de landscape móvil la achica, mientras su atributo `width` sigue
   diciendo 24.
   `translate` y `scale` van como **propiedades independientes** y no dentro de un `transform`,
   porque necesitan relojes distintos.
5. **Sincronía** — ver §3.1c.
6. **Móvil hereda**, sin puerta y a propósito.
7. **PvP heredará** por construcción: el destino se resuelve por índice de jugador, así que el
   mismo código sirve sin tocar una línea.

> **Defecto que sólo apareció al haber escala, y que la medición encontró.** `.vc-ficha` es un
> bloque con un `<img>` **en línea** dentro, así que su caja medía **24×31,09**: los 7,09 px de más
> son el hueco del descendente de la línea. Con `margin: -12px` la moneda quedaba centrada igual y
> nadie lo notó nunca — hasta que hubo `scale`, que pivota sobre el centro del **envoltorio**,
> 3,55 px por debajo del de la moneda, y la arrastraba fuera del destino. Medido: la última moneda
> aterrizaba a **dy = 3,547 px** con la caja en 16×20,73. Se corrige con `line-height: 0` **en
> línea** —`gameTable.css` es protegido y no se abre—, y tras el arreglo: envoltorio 24×24,
> dy = 0.

### 3.1c El saldo diferido y el pozo que se vacía (VIS-3)

**El motor liquida antes de pintar** (§3.1): cuando la fase de pago aparece, el pozo ya es 0 y el
ganador ya tiene sus fichas. El dinero llegaba **antes** que las monedas, así que el vuelo
ilustraba un movimiento ya ocurrido. La corrección vive entera en la capa de UI —`gameEngine.js`
es protegido—:

- **el pozo** muestra su cifra hasta que **sale la primera** moneda, y 0 desde ese instante;
- **el saldo del ganador** muestra el valor previo hasta que **aterriza la séptima**.

**No hay estado nuevo, y es deliberado.** La retención se **deriva** de la celebración, que ya sabe
todo lo necesario: existe (`activa`), vuela (`llevaViaje`), ya salió la primera (`!esperando`). De
ahí sale sola la **liberación garantizada** por las seis salidas —aterrizaje, techo de duración,
«Siguiente mano», cambio de fase, desmontaje, corte por resize—, porque son *exactamente* los seis
caminos por los que `activa` vuelve a `null`, los mismos que §6 ya sellaba. Un estado paralelo
tendría que replicar los seis y envejecería con el séptimo.

La **cifra del pozo y el ganador viajan dentro de la geometría** (`geometriaViaje` los devuelve),
por higiene —un ref no se lee durante el render— y por exactitud: quedan congelados en el mismo
instante en que se miden las monedas.

El armado usa **`useLayoutEffect`**, no `useEffect`. Desde que las cifras se difieren, el instante
en que la celebración se arma *es* el instante en que se retienen. Con un efecto normal React
pinta primero el render de pago con los valores crudos: medido, **un fotograma de 19 ms** enseñando
el resultado antes de volver atrás. Un efecto de layout corre antes de pintar y el rebote
desaparece. La lógica no cambia.

> **Y LOS DOS HERMANOS TIENEN QUE SER DE LA MISMA CLASE.** §3.0 sella que el efecto que dispara
> `showdown.mp3` es hermano **anterior** al de `useCelebracion`, y que ese orden es portante. Ese
> orden es el de **declaración**, pero sólo dentro de la misma clase de efecto: React vacía **todos**
> los de layout antes que **cualquier** pasivo. Al pasar sólo uno de los dos a `useLayoutEffect`, el
> orden se invirtió: la celebración se armaba antes de que el ref tuviera el asa, `precedente()`
> devolvía `null`, `esperaPrecedente` daba 0 y el viaje salía **en paralelo** con `showdown.mp3` —
> exactamente la avería que VC2b vino a arreglar.
> **Lo cazó el arnés**, no la lectura: `vc·jugado` dio `secuencia=false · espera=1ms` con
> `showdown.mp3` y `chips-collect` sonando a la vez. Las 20 celdas construidas seguían en verde,
> porque construyen la celebración y no la esperan. Es el argumento entero a favor de tener una
> sub-pasada que **juega**.
> La corrección: el efecto de `showdown` en `GameTable` pasa también a `useLayoutEffect`. Que el
> `play()` ocurra antes de pintar no cambia nada — el sonido no espera al fotograma.

**Sólo pinta:** `playerChips` —el que gobierna qué apuestas se pueden hacer— sigue leyendo el valor
real del motor. La retención no toca ninguna decisión de juego.

**Invariantes.** Nunca se muestra menos que `chips − pozo`. Nunca se retiene sin vuelo. Sólo retiene
el **ganador**. Cuando hubo volteo, la retención dura la espera a `showdown.mp3` **más** el vuelo
(medido: 2087 ms + 1640 ms); esa suma excede a propósito el techo de 2,5 s de §1, igual que ya lo
hacía la secuencia de VC2b, y por la misma razón: el techo acota la **celebración**, no la espera
al sonido del ganador.

### 3.2 El pulso dorado

Un ciclo, uno solo, sobre **elemento propio** (`.vc-pulso`, absoluto dentro de `.pbr-name`).

**No se toca la abreviatura `animation` de `.player-zone`**: ahí vive `turnBreath`. En fase de
pago el halo de turno está apagado —`turnSeat` es `null`, y VC1 midió `animation: none` y
`box-shadow: none`—, así que hoy no podrían pisarse; compartir la propiedad sería pedir que algún
día lo hagan.

### 3.3 AJILEI

La palabra en grande con el tratamiento de marca: `--gold-brand` y la traza de `.table-title`
(`5px/22px` = `0,23em`), tokens vivos. Aparición molde `msgPop`, una sola vez, breve.

**El viaje del pozo también corre debajo** — el pozo se ganó igual —, pero **sin el pulso y sin el
roce de fichas**: el rasgueo es el sonido de ese momento y no comparte.

### 3.4 Capas

| Capa | Quién | Por qué |
|---|---|---|
| **26** | Viaje y pulso | Por encima de todo el tablero y de la burbuja de reacciones (25), y **por debajo** del panel de utilidades (30): una celebración no tapa la superficie que el usuario está tocando — doctrina sellada en U2 |
| **32** | AJILEI | Un peldaño sobre los popups (31), porque es el momento y debe verse entero; y muy por debajo de los modales bloqueantes (100 abandonar, 120 bancarrota) |

Ninguna va tras el gate de escritorio: **una victoria se celebra igual en el teléfono**, y al no
ocupar flujo no pueden mover el layout de nadie.

---

## 4. Partida ganada

**La `.game-over-screen` de victoria evoluciona; la de derrota no cambia ni un byte.** El decisor
devuelve `'partida'` únicamente con `winner === 0`, y sin eso no se monta nada.

- **Dos nudillos secos** al entrar.
- El **"¡Ganaste la mesa!"** en oro **se conserva** tal cual.
- Debajo, la **tarjeta-resumen**: fichas netas, manos jugadas, manos ganadas y la mejor mano.

### 4.1 La tarjeta es la pantalla, no un overlay

Cuando el humano gana la mesa **el tablero ya no existe**: `isGameOver` lo sustituye. La tarjeta
no se superpone a nada — vive **en flujo** dentro de la pantalla terminal. Por eso está exenta del
techo de duración.

### 4.2 Conteo sereno, jamás odómetro

Interpolación con **salida suave** (`easeOutCubic`): arranca rápido y **aterriza**, en vez del giro
plano y sin fin del odómetro de tragamonedas — **vetado por posicionamiento**. 1400 ms. **El toque
corta el conteo al valor final**, misma vía que corta una celebración de mesa.

La mejor mano se dice con la **voz de "Mano actual"** (`Menu_Utilidades_v1.3` §3.1): palo y
puntaje relativo — `"Oros, 41 pts"` —, desde `getBestSuitScore`, jamás el nominal impreso.

---

## 5. Sesión — acumulados sin persistencia

Cuarto hook de la familia (`useUtilitiesMenu`, `useReacciones`, `useConsultas`, **`useSesion`**),
con **núcleo puro separado** que Vitest sella. **El motor no se toca ni para estadística.**

`useReducer` y no `useState`: acumular es exactamente lo que un reductor hace, y `anotarMano` ya
**es** su función reductora. Guarda de **idempotencia por `handCount`** dentro del núcleo: sin
ella, cualquier re-render o doble disparo de StrictMode contaría la misma mano dos veces, y una
cifra de "manos jugadas" inflada es peor que no mostrarla.

> **Sin persistencia, deliberado.** La tarjeta resume **la partida que acaba de terminar**, no la
> vida del jugador. Un acumulado que sobreviva a la recarga contaría manos de otra mesa y la cifra
> dejaría de significar lo que dice.

---

## 6. El toque que corta

`pointerdown` en **captura** y **sin overlay** — molde H4. Un overlay se tragaría el primer clic
sobre "Siguiente mano", y la celebración ocurre justo encima de ese botón: el clic **corta la
celebración Y sigue su curso**.

Corta **visual y audio de un golpe**. El audio exige el id de Howler, y para eso `play()` **pasa a
devolverlo** (`{ sound, id }`) — una línea aditiva: ninguna de las llamadas anteriores se entera.
Sin ese id se cortaría el dibujo y el sonido seguiría sonando solo.

**VC2b · corta en cualquier punto de la secuencia, la espera incluida.** Si el toque llega mientras
`showdown.mp3` todavía suena, la celebración **no llega a nacer** —ni entonces ni después—: el
corte suelta el listener `end` y su temporizador-red, e incrementa la guardia de id para que un
`end` tardío no resucite lo cortado. Lo que **no** se toca es `showdown.mp3`: no es el sonido de la
celebración sino el del volteo, y suena igual en cada mano que el humano pierde, donde este gesto
ni existe. Puerta propia en el arnés (`vc·guardia corte`), con victoria natural y todo.

**El mute se hereda gratis** y está **verificado, no asumido**: `Howler.mute()` es global y
silencia incluso lo que ya está sonando. El arnés lo apaga **por la entrada del menú** —el camino
del usuario, no una API— y comprueba lo que el diseño afirma: que silencia el **audio** y no toca
el **dibujo**.

---

## 7. Audio

| Archivo | Licencia | Medido | Volumen |
|---|---|---|---|
| `chips-collect.mp3` | Pixabay Content License · ID **96121** | 0,967 s · 2 ataques | 0,7 |
| `ajilei-strum.mp3` | Pixabay Content License · ID **504874** | 3,657 s · **2 rasgueos** | 0,8 |
| `table-knock.mp3` | Pixabay Content License · ID **85867** | 1,896 s · **2 golpes** ✓ | 0,6 |

Volúmenes elegidos contra el **pico medido** de cada archivo, no a ojo: el knock es el más fuerte
(0,383) y dos golpes secos no deben sobresaltar; el strum es el más flojo (0,188) y es el momento
héroe. Los tres dentro del rango de la casa 0,4–0,8.

### 7.1 El recorte del rasgueo

`ajilei-strum.mp3` traía **dos** rasgueos —uno en 0,21 s y un segundo racimo en 1,59/1,72/1,84— y
2,8 s útiles. El diseño pide **uno solo** y ≤2 s.

**Se recorta al reproducir, no en el archivo:** fade a los 1300 ms con la misma cortina de 130 ms
que `cardShuffle` ya usa. No hay `ffmpeg` en el entorno, es el molde que la casa ya tenía, y deja
el archivo licenciado **exactamente como Pixabay lo distribuye** — que para una licencia es lo
preferible, no un mal menor.

El `table-knock` **ya venía con dos golpes**: no se toca.

### 7.2 `win.mp3` sale de servicio

La fanfarria genérica que sonaba en **cada** mano ganada la sustituye el sonido del nivel que
decide el decisor, disparado junto con su dibujo: fichas que se deslizan y suenan a la vez, no una
fanfarria suelta. **`showdown.mp3` se conserva exacto**: es el sonido del volteo, no de la
victoria, y suena igual gane quien gane.

**`win.mp3` queda en el repositorio sin uso.** Borrarlo es otra tanda.

### 7.3 Regla de licencias

Tras la lección de la lámina GNU (`Diseno_Landscape` §10.3): **ningún audio entra al repositorio
sin licencia verificada y anotada**. Las tres de arriba lo están.

---

## 8. Arnés — modos `vc` y `vuelo`

### 8.0 `vuelo` — el modo que JUEGA (VIS-3)

`vc` **construye** la celebración para poder auditar 20 celdas en tiempo razonable, y eso está bien
para capas, tokens y Δ=0. Pero el contrato de VIS-3 es *«el vuelo aterriza sobre la moneda del
ganador»*, y **un ganador no se puede construir**: hay que ganarle o perder contra él. `vuelo`
juega dos escenarios en mesa 5 —uno por bando— y mide:

- el **destino**, del atributo `data-coin-target`, **corroborado aparte** (chip de puntaje del
  showdown, o mensaje de victoria) para que el arnés no se limite a repetirle a la app lo que ella
  misma dijo;
- el **aterrizaje** de la séptima moneda, a ±1 px del centro del destino;
- la **escala**, dividiendo el lado *medido* del destino entre el lado *medido* de la moneda en
  vuelo — ni un 24 ni un 36 escritos en el arnés;
- **N = 7**, contra `VIAJE_N` importada de la app;
- el **orden de sucesos**: el pozo a 0 al salir la primera, el saldo arriba tras la séptima;
- la **ausencia de celebración** cuando gana una IA.

> **Por qué el aterrizaje se muestrea y no se escucha.** El `transitionend` de la séptima moneda
> cae en `540 + 1100 = 1640 ms`, que es exactamente cuando `useCelebracion` desmonta la capa. Es
> una carrera y se pierde: medido, **6 de 7** eventos. El modo guarda el último rect visto por
> `requestAnimationFrame`; la cola del easing es casi plana, y donde el evento sí llegó los dos
> métodos coinciden al milésimo.

> **Alcance declarado.** El orden de sucesos del **saldo** sólo se comprueba en la victoria humana.
> El saldo de una IA vive detrás del toggle de su ficha de esquina, y abrirlo durante el vuelo es
> imposible por construcción: un `pointerdown` corta la celebración (§6). En la victoria de IA se
> comprueba el pozo, la ausencia de celebración, y que al abrir el toggle **después** el saldo ya
> esté liberado.

> **El robot descarta de verdad.** Sin descartar, el humano no gana una mano en mesa 5
> auto-jugando — el mismo hallazgo que acotó la sub-pasada jugada de `vc` a la mesa de 2 (§8.1).

### 8.1b Lo que VIS-3 tuvo que reparar en `vc`

Dos cosas, y ninguna era un fallo del modo: eran **memoria**.

- La sub-prueba del **decisor** sellaba `winner !== 0 → null`. Se reescribe a lo que la doctrina
  protege de verdad —que recolectar no celebre— y se comprueba por **banderas**
  (`overlay: false, fanfarria: false`), no por ausencia de nivel.
- **`vcGeo` era una segunda copia de la geometría** (`.pot-box` → `.pbr-chips`, `fichas: 5`
  cableado) que `p8_geometria` comparaba **contra sí misma**. Habría seguido en verde mientras la
  app volaba de moneda a moneda y con siete fichas. Es la misma enfermedad que VIS-1c-b curó en el
  modo `tapetes`, y la misma cura: el arnés lee el **contrato vivo** —los atributos y la constante
  de la app— en vez de un recuerdo.

### 8.1 `vc` — la matriz construida

**Receta O2: el peor caso se construye.** AJILEI no se alcanza jugando —cinco del palo sumando
51— y la partida pide arruinar a todas las IAs. La matriz de **20 celdas** inyecta el DOM exacto
que los componentes pintan y audita el contrato de CSS: capa 26/32 contra el **censo vivo**, Δ=0
**durante y después**, geometría del viaje y el pulso de un ciclo sobre elemento propio.

El **decisor** se comprueba en Node contra la fuente única, incluido el blindaje del AJILEI
perdido con `winner !== 0`.

La celebración **de verdad** va en sub-pasada **jugada**: se repiten manos hasta que gana el
humano y ahí se observa **Howler de verdad** (`window.Howler._howls`) — que suene `chips-collect`,
que `win.mp3` **no** suene, y que el toque corte dibujo y sonido.

**VC2b · la secuencia se observa en sus dos tiempos**, con lo que hay en la página y no con relojes
de arnés: en el instante del pago `showdown.mp3` **suena** y el viaje **no está** en el DOM; cuando
el viaje aparece, `showdown` ya **no** suena y `chips-collect` sí. Y una sub-pasada **guardias**
con dos victorias naturales propias, porque son estados de partida incompatibles y compartir una
mano mediría uno de los dos mal:

| Escenario | Qué prueba |
|---|---|
| **mute** | apagado por el menú **antes** de jugar: el viaje sale **en el mismo instante** del pago y no suena absolutamente nada |
| **corte** | el toque llega **durante** la espera: la celebración no nace, y sigue sin nacer 3,2 s después |

### 8.2 Alcance declarado de la sub-pasada jugada de `vc`

**Corre sólo en mesa 2**, y se dice en vez de recortarlo en silencio. Se intentó mesa 5 y **no es
alcanzable auto-jugando**: con cuatro rivales, un muestreador que siempre pasa y nunca descarta
pierde fichas de forma sostenida y llega a la bancarrota antes que a una victoria — 18 manos de
tope, ninguna ganada. Rigar la estrategia para forzarla mediría el muestreador, no el juego.

Lo que esa sub-pasada verifica es el **cableado vivo**, que es el mismo hook y el mismo componente
en las cuatro mesas. Lo que sí varía por mesa es la **geometría**, y ésa la cubren las 20 celdas
construidas, mesa 5 incluida.

### 8.3 Dos lecciones de medición

**El motor importa sin extensión y es archivo protegido.** `gameEngine.js` hace
`import … from './handEvaluator'`; Vite y Vitest lo resuelven, Node ESM no. El arreglo obvio toca
un protegido, así que **el arnés se adapta al motor**: un gancho de resolución propio
(`scripts/_resolveExt.mjs`) que prueba con `.js`. U3 esquivó el problema importando sólo módulos
autocontenidos; VC2 ya no podía, porque el decisor necesita `PHASES` e `isAjilei`.

**Δ=0 se mide contra el mismo estado de juego.** La primera versión de la puerta jugada comparaba
la fase de pago contra el estado de espera y acusaba 165,55 px de deriva — que era el reparto de
la mano, no el overlay. La comparación honesta es **con celebración contra sin ella**, ambas tomas
en pago.

---

## 9. Deuda conocida

**Bug preexistente del motor, registrado y NO tocado** (`gameEngine.js` es archivo protegido):

En **mesa 2**, con **ambos jugadores en AJILEI**, el mensaje dice
`'¡Ambos con AJILEI! Ganas por ser el mano.'` **sin consultar quién ganó de verdad**. El desempate
real ya se resolvió arriba por orden de asiento desde la Mano: si la IA es Mano, **gana la IA y el
texto miente**.

La celebración **no se ve afectada** —el decisor lee `winner` del estado, jamás el mensaje—, que
es precisamente por qué la doctrina "fase + emisor, jamás regex" existe. **Corrección pendiente de
fase 4**, cuando los protegidos se abran.

> **VIS-3 lo agrava en lo visible, sin tocarlo.** Ahora el vuelo va a la moneda del ganador REAL,
> que el decisor lee del estado. Así que en ese caso el texto dirá que ganaste y las monedas se
> irán a la IA. La contradicción ya existía —el saldo también decía la verdad—, pero pasa a verse
> en movimiento. **Es un argumento a favor de la corrección, no en contra del vuelo:** el vuelo
> está diciendo la verdad.

**Anotado en VIS-3, sin tocar** (`gameTable.css` es archivo protegido, §2 de la lista canónica):
`.vc-ficha` declara `will-change: transform, opacity`. Desde VIS-3 la propiedad que anima ya no es
`transform` sino `translate` y `scale`, que son propiedades independientes y **no** están cubiertas
por esa pista. Es una pista al compositor, no una cuestión de corrección —las corridas aterrizan a
Δ=0—, así que se deja para cuando ese archivo se abra.

---

## 10. Historial de versiones

- **v1.0** — 2026-08-08. Nace la especificación con su implementación (**DSK-VC2**), sobre el
  diagnóstico **DSK-VC1**. Tres niveles sellados, regla `winner === 0` sin excepción con blindaje
  explícito del AJILEI perdido, ambas variantes de AJILEI, jerarquía verificada contra la
  secuencia real, sustitución de `win.mp3`, la tarjeta como pantalla, sesión sin persistencia, las
  tres licencias con sus IDs y el bug conocido de mesa 2. Modo `vc` permanente del arnés
  (20 celdas construidas + sub-pasadas jugada y de reloj/mute + decisor en Node) y 26 pruebas
  nuevas de Vitest sobre los dos núcleos puros.
- **v1.0b** — 2026-08-13 (**DSK-VC2b**). El viaje del pozo pasa a ser **secuencial** al sonido del
  ganador: arranca en el `end` de `showdown.mp3` en vez de solaparse con él (§3.0). Guardia
  obligatoria de arranque inmediato cuando no hubo volteo o el mute está puesto, sellada en
  `esperaPrecedente` con 7 pruebas nuevas. El toque corta también **durante la espera** (§6). El
  modo `vc` suma la puerta de secuencia en la sub-pasada jugada y una sub-pasada **guardias** con
  dos victorias naturales (mute · corte), y su reloj se corrige para medir desde el arranque.
- **v1.1** — 2026-08-21 (**VIS-3**, HEAD de partida `9f7dd13`). **Vuelo v2: el pozo va de moneda a
  moneda.** Origen y destino dejan de ser cajas y pasan a ser Heptacoins, con el destino resuelto
  por identificador estable `data-coin-target` = índice del motor (§3.1b). Siete monedas siempre
  (`VIAJE_N`). Micro-ajuste de escala al llegar, **medido** del destino. Nace el cuarto nivel,
  **`'recoleccion'`** (§1, §2.1): la victoria de IA deja de no producir nada y pasa a mover el
  pozo, sin overlay, sin pulso y sin fanfarria — la guarda `winner === 0` se reabre con
  contabilidad y el blindaje del AJILEI perdido queda intacto. **Saldo diferido y pozo retenido**
  (§3.1c), derivados de la celebración y sin estado nuevo, con `useLayoutEffect` para que el primer
  fotograma de la fase de pago ya salga retenido. Móvil hereda sin puerta; PvP heredará por
  construcción. Modo **`vuelo`** permanente del arnés, que JUEGA en vez de construir (§8.0), y
  reparación de dos memorias del modo `vc` (§8.1b). 4 pruebas nuevas de Vitest y reescritura del
  bloque del decisor.
