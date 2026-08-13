# AJILEI — Victory Celebration v1.0

**Estado:** Especificación sellada e implementada.
**Fecha:** 2026-08-08
**Base de código:** HEAD `973e94d` (PWA-M1). Implementado en la tanda **DSK-VC2**, sobre el
diagnóstico read-only **DSK-VC1**.
**Autoridad visual:** `AJILEI_Sistema_Diseno_v1.2.md`.
**Documentos relacionados:** `AJILEI_Menu_Utilidades_v1.3.md` (moldes de capa, anclaje por tinta,
núcleo puro sellado por Vitest).

---

## 1. Qué se celebra, y qué no

Tres niveles por rareza, **sólo para victorias del humano**. Las derrotas y las manos que ganan
las IAs **no se subrayan**: pasan exactamente como hoy.

| Nivel | Cuándo | Qué ocurre |
|---|---|---|
| **Mano ganada** | Fase de pago, gana el asiento 0 | El pozo viaja a tu pila + un pulso dorado en tu nombre |
| **AJILEI** | Fase de pago, gana el asiento 0 **y** su mano es perfecta | La palabra **AJILEI** en grande + rasgueo. **Sustituye** al nivel anterior |
| **Partida ganada** | Fin de mesa, último con fichas | Dos nudillos secos + tarjeta-resumen |

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

### 2.1 `winner === 0`, sin excepción

Es la **primera** guarda, y lo es porque de ella depende el caso que más fácil se cuela.

> **BLINDAJE: un AJILEI perdido NO celebra.**
> Ocurre de verdad. Con dos AJILEI en mesa, el desempate lo gana el más cercano a la Mano: el
> humano puede tener **mano perfecta y perder**. Mano perfecta y derrota siguen siendo derrota.
> El caso tiene prueba propia en Vitest y puerta propia en el arnés — construida con
> `winner !== 0`, que es justo lo que jugando no se puede provocar.

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
el `translate` y la transición hace el resto. Origen y destino se miden **en vivo** al disparar:
`.pot-box` → `.pbr-chips`.

> **Hallazgo de VC1 que fija el destino:** `.corner-chip` **no existe** en la zona del humano en
> ninguna de las 20 celdas. El destino es la pila de la barra, no un chip de esquina.
> La trayectoria es única y estable: siempre abajo-derecha, entre 637,72 y 742,02 px.

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
| `ajilei-strum.mp3` | Pixabay Content License · ID **85867** | 3,657 s · **2 rasgueos** | 0,8 |
| `table-knock.mp3` | Pixabay Content License · ID **504874** | 1,896 s · **2 golpes** ✓ | 0,6 |

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

## 8. Arnés — modo `vc`

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

### 8.1 Alcance declarado de la sub-pasada jugada

**Corre sólo en mesa 2**, y se dice en vez de recortarlo en silencio. Se intentó mesa 5 y **no es
alcanzable auto-jugando**: con cuatro rivales, un muestreador que siempre pasa y nunca descarta
pierde fichas de forma sostenida y llega a la bancarrota antes que a una victoria — 18 manos de
tope, ninguna ganada. Rigar la estrategia para forzarla mediría el muestreador, no el juego.

Lo que esa sub-pasada verifica es el **cableado vivo**, que es el mismo hook y el mismo componente
en las cuatro mesas. Lo que sí varía por mesa es la **geometría**, y ésa la cubren las 20 celdas
construidas, mesa 5 incluida.

### 8.2 Dos lecciones de medición

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
